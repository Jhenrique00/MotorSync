import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { backendStatus } from '../config/environment';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState(backendStatus.error);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authChanged = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      authChanged = true;
      if (active) {
        setSession(next);
        setError('');
        setLoading(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error: failure }) => {
        if (!active) return;
        if (failure) setError('Não foi possível recuperar a sessão. Tente entrar novamente.');
        if (!authChanged) setSession(data.session);
      })
      .catch(() => {
        if (active) setError('Não foi possível conectar ao serviço de autenticação.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const handleState = (state) =>
      state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh();
    let listener;
    if (Platform.OS !== 'web') {
      handleState(AppState.currentState);
      listener = AppState.addEventListener('change', handleState);
    }
    return () => {
      active = false;
      subscription.unsubscribe();
      listener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <AuthContext.Provider value={{ session, loading, error, configured: backendStatus.configured }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
