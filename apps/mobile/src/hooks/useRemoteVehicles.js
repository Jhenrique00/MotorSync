import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { vehicleApi } from '../services/vehicleApi';
export function useRemoteVehicles(id) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [record, setRecord] = useState(null),
    [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setRecord(null);
      if (userId && vehicleApi) {
        const request = id ? vehicleApi.get(id) : vehicleApi.catalog();
        request
          .then((data) => {
            if (active) setRecord({ userId, id, data, error: '' });
          })
          .catch(() => {
            if (active)
              setRecord({
                userId,
                id,
                data: null,
                error:
                  'Não foi possível carregar os veículos. Verifique a conexão e tente novamente.',
              });
          });
      }
      return () => {
        active = false;
      };
    }, [userId, id, revision]),
  );
  const current = record?.userId === userId && record?.id === id ? record : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: Boolean(userId && !current),
    reload: () => setRevision((n) => n + 1),
  };
}
