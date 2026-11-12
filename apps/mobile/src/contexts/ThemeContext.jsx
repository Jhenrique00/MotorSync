import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes } from '../theme/tokens';
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [preference, setPreference] = useState('system');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem('motorsync.theme')
      .then((value) => {
        if (alive && ['system', 'light', 'dark'].includes(value)) setPreference(value);
      })
      .catch(() => {
        if (alive) setStorageError('Não foi possível recuperar o tema salvo.');
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduceMotion(v);
      })
      .catch(() => {
        if (alive) setReduceMotion(true);
      });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  const mode = preference === 'system' ? system || 'light' : preference;
  async function changeTheme(value) {
    if (!['system', 'light', 'dark'].includes(value)) return;
    setPreference(value);
    try {
      await AsyncStorage.setItem('motorsync.theme', value);
      setStorageError('');
    } catch {
      setStorageError('Tema aplicado, mas não salvo neste dispositivo.');
    }
  }
  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors: palettes[mode],
        preference,
        changeTheme,
        ready,
        storageError,
        reduceMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
