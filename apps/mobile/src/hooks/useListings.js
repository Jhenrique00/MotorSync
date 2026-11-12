import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { listingApi } from '../services/listingApi';
export function useListings(mode = 'catalog', id) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [record, setRecord] = useState(null),
    [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setRecord(null);
      if (!listingApi || (['mine', 'organization'].includes(mode) && !uid)) {
        setRecord({ uid, mode, id, data: [], error: '' });
        return;
      }
      (mode === 'organization'
        ? listingApi.organization(id)
        : id
          ? listingApi.get(id)
          : listingApi[mode]()
      )
        .then((data) => {
          if (active) setRecord({ uid, mode, id, data, error: '' });
        })
        .catch((e) => {
          if (active)
            setRecord({
              uid,
              mode,
              id,
              data: [],
              error: ['PGRST205', '42P01'].includes(e.code)
                ? 'Os anúncios ainda não estão disponíveis. A atualização do serviço está pendente.'
                : 'Não foi possível carregar os anúncios. Verifique sua conexão e tente novamente.',
            });
        });
      return () => {
        active = false;
      };
    }, [uid, mode, id, revision]),
  );
  const current = record?.uid === uid && record?.mode === mode && record?.id === id ? record : null;
  return {
    data: current?.data,
    loading: !current,
    error: current?.error,
    reload: () => setRevision((n) => n + 1),
  };
}
