import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { listingFavoritesApi } from '../services/listingFavoritesApi';
import { isUuid } from '../utils/identifiers';

const FavoritesContext = createContext(null);
const syncError = 'Não foi possível sincronizar seus favoritos. Verifique a conexão.';

export function ListingFavoritesProvider({ children }) {
  const { session } = useAuth();
  const userId = session?.user?.id || null;
  const latestUser = useRef(userId);
  latestUser.current = userId;
  const inFlight = useRef(new Set());
  const [busyIds, setBusyIds] = useState(new Set());
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState({ userId: null, ids: [], loading: false, error: '' });
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    inFlight.current.clear();
    setBusyIds(new Set());
    if (!userId) {
      setSnapshot({ userId: null, ids: [], loading: false, error: '' });
      return () => {
        active = false;
      };
    }
    setSnapshot((previous) => ({
      userId,
      ids: previous.userId === userId ? previous.ids : [],
      loading: true,
      error: '',
    }));
    (listingFavoritesApi
      ? listingFavoritesApi.list(userId)
      : Promise.reject(new Error('Conexão com Supabase indisponível.'))
    )
      .then((ids) => {
        if (active && latestUser.current === userId)
          setSnapshot({ userId, ids, loading: false, error: '' });
      })
      .catch(() => {
        if (active && latestUser.current === userId)
          setSnapshot((previous) => ({ ...previous, userId, loading: false, error: syncError }));
      });
    return () => {
      active = false;
    };
  }, [userId, revision]);

  // Nunca mostramos os favoritos de uma conta anterior após uma troca de sessão.
  const ids = snapshot.userId === userId ? snapshot.ids : [];
  const loading = Boolean(userId && (snapshot.userId !== userId || snapshot.loading));
  const error = snapshot.userId === userId ? snapshot.error : '';

  const toggle = useCallback(
    async (listingId) => {
      if (!userId) throw new Error('Entre na sua conta para salvar anúncios.');
      if (!isUuid(listingId)) throw new Error('Anúncio inválido.');
      if (!listingFavoritesApi) throw new Error('Supabase não configurado.');
      if (loading) throw new Error('Aguarde seus favoritos carregarem.');
      if (inFlight.current.has(listingId)) return;

      const selected = !ids.includes(listingId);
      inFlight.current.add(listingId);
      setBusyIds(new Set(inFlight.current));
      try {
        await listingFavoritesApi.set(userId, listingId, selected);
        if (latestUser.current === userId)
          setSnapshot((previous) =>
            previous.userId !== userId
              ? previous
              : {
                  ...previous,
                  error: '',
                  ids: selected
                    ? [...new Set([...previous.ids, listingId])]
                    : previous.ids.filter((id) => id !== listingId),
                },
          );
        return selected;
      } catch (failure) {
        if (latestUser.current === userId)
          setSnapshot((previous) => ({ ...previous, error: syncError }));
        throw failure;
      } finally {
        if (latestUser.current === userId) {
          inFlight.current.delete(listingId);
          setBusyIds(new Set(inFlight.current));
        }
      }
    },
    [userId, ids, loading],
  );

  return (
    <FavoritesContext.Provider value={{ ids, loading, error, busyIds, toggle, reload, userId }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useListingFavorites = () => {
  const favorites = useContext(FavoritesContext);
  if (!favorites) throw new Error('ListingFavoritesProvider não configurado.');
  return favorites;
};
