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
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Android/BlueStacks can invalidate the Keystore key after an emulator
      // reset or an Expo Go reinstall. Only a broken encrypted session is
      // discarded; other storage failures still surface to the caller.
      const detail = String(error?.message || error);
      if (!/could not decrypt|keystore operation failed|key permanently invalidated/i.test(detail))
        throw error;
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // Some emulators cannot delete an entry whose Keystore key is lost.
        // A fresh login may still require clearing Expo Go's app data.
      }
      return null;
    }
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
