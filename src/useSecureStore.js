import * as SecureStore from 'expo-secure-store';

export default function useSecureStore(key) {
    return {
      getItem: (...args) => SecureStore.getItemAsync(key, ...args),
      setItem: (...args) => SecureStore.getItemAsync(key, ...args),
      removeItem: (...args) => SecureStore.deleteItemAsync(key, ...args),
    };
  }