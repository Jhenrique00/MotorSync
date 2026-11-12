import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// Native uses encrypted OS storage; web persists in browser storage.
const memory = new Map();
export const sessionStorage = {
  async getItem(key) {
    if (Platform.OS === 'web')
      return typeof localStorage === 'undefined'
        ? memory.get(key) || null
        : localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      else memory.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      else memory.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
