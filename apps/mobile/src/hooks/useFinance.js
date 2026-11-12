import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { createFinanceApi } from '../services/financeApi';
import { createAccountApi } from '../services/accountApi';
import { useAuth } from '../contexts/AuthContext';
export const financeApi = supabase ? createFinanceApi(supabase) : null;
export function useFinance(options) {
  const { session } = useAuth();
  const key = JSON.stringify([options, session?.user.id]);
  const [result, setResult] = useState(null),
    [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!session || !financeApi) {
        setResult({ key, login: true, members: [] });
        return;
      }
      Promise.all([
        createAccountApi(supabase).load(),
        financeApi
          .report(options)
          .then((data) => ({ data }))
          .catch((e) => {
            if (['PGRST202', '42883'].includes(e.code)) return { pending: true };
            throw e;
          }),
      ])
        .then(([account, state]) => {
          if (active)
            setResult({
              key,
              ...state,
              members: account.memberships.filter((m) => ['owner', 'manager'].includes(m.role)),
            });
        })
        .catch((e) => {
          if (active)
            setResult({
              key,
              error:
                e.code === '42501'
                  ? 'Você não tem permissão para este financeiro.'
                  : 'Não foi possível carregar o financeiro. Verifique a conexão.',
            });
        });
      return () => {
        active = false;
      };
    }, [key, revision]),
  );
  return {
    ...(result?.key === key ? result : {}),
    loading: result?.key !== key,
    reload: () => {
      setResult(null);
      setRevision((n) => n + 1);
    },
  };
}
