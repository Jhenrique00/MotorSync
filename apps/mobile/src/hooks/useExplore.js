import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { createExploreApi } from '../services/exploreApi';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
export const exploreApi = supabase ? createExploreApi(supabase) : null;
export function useExplore(options, page) {
  const { session } = useAuth();
  const key = JSON.stringify([options, page, session?.user.id]);
  const [result, setResult] = useState(null),
    [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const timer = setTimeout(() => {
        (exploreApi
          ? exploreApi.search(options, page)
          : Promise.reject(new Error('Serviço não configurado.'))
        )
          .then((data) => {
            if (active) setResult({ key, ...data });
          })
          .catch((e) => {
            if (active)
              setResult({
                key,
                error: e.message || 'Não foi possível pesquisar. Tente novamente.',
              });
          });
      }, 300);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }, [key, revision]),
  );
  const current = result?.key === key ? result : null;
  return {
    ...current,
    loading: !current,
    reload: () => {
      setResult(null);
      setRevision((v) => v + 1);
    },
  };
}
export function useListingChoices(selection, field) {
  const key = JSON.stringify([
    selection.category,
    selection.subcategory,
    selection.filters.brand,
    selection.filters.model,
    field,
  ]);
  const [state, setState] = useState({});
  useEffect(() => {
    let active = true;
    if (!exploreApi) {
      setState({ error: true });
      return;
    }
    setState({ loading: true });
    exploreApi
      .choices(selection, field)
      .then((options) => {
        if (active) setState({ options });
      })
      .catch(() => {
        if (active) setState({ error: true });
      });
    return () => {
      active = false;
    };
  }, [key]);
  return state;
}
