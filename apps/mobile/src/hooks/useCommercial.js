import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { createCommercialApi } from '../services/commercialApi';
import { commercialError } from '../utils/commercial';
export const commercialApi = createCommercialApi(supabase);
export function useCommercial(section, organizationId) {
  const { session } = useAuth();
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const generation = useRef(0),
    locked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const current = ++generation.current;
      setState({ loading: true });
      setBusy(false);
      locked.current = false;
      (async () => {
        if (!session) {
          if (current === generation.current) setState({ loading: false, ready: false });
          return;
        }
        try {
          const ready = await commercialApi.ready();
          const personalReady = ready && (await commercialApi.personalReady());
          let members = [],
            rows = [],
            customers = [],
            vehicles = [];
          if (ready) {
            if (section === 'summary') rows = await commercialApi.summary();
            else if (section === 'mine') rows = await commercialApi.mine();
            else {
              members = await commercialApi.members();
              if (
                (organizationId === 'personal' && personalReady) ||
                members.some((m) => m.organization_id === organizationId)
              ) {
                if (section === 'clients') rows = await commercialApi.customers(organizationId);
                if (section === 'sales')
                  [rows, customers, vehicles] = await Promise.all([
                    commercialApi.sales(organizationId),
                    commercialApi.customers(organizationId),
                    commercialApi.vehicles(organizationId),
                  ]);
                if (section === 'proposals')
                  [rows, customers, vehicles] = await Promise.all([
                    commercialApi.proposals(organizationId),
                    commercialApi.customers(organizationId),
                    commercialApi.vehicles(organizationId),
                  ]);
              }
            }
          }
          if (current === generation.current)
            setState({ loading: false, ready, personalReady, members, rows, customers, vehicles });
        } catch (error) {
          if (current === generation.current)
            setState({ loading: false, error: commercialError(error) });
        }
      })();
      return () => {
        generation.current++;
      };
    }, [session?.user.id, section, organizationId, revision]),
  );
  async function run(operation, refresh = true) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    const current = generation.current;
    try {
      await operation();
      if (current !== generation.current) return false;
      if (refresh) setRevision((r) => r + 1);
      return true;
    } catch (error) {
      if (current === generation.current)
        setState((s) => ({ ...s, error: commercialError(error) }));
      return false;
    } finally {
      if (current === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  return { ...state, session, busy, run, reload: () => setRevision((r) => r + 1) };
}
