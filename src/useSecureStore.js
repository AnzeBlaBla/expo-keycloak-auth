import * as SecureStore from 'expo-secure-store';
const STORAGE_LIMIT = 2048; // Value is split up into chunks of 2048 bytes
export default function useSecureStore(key) {
  return {
    getItem: async () => {
      const baseVal = JSON.parse(await SecureStore.getItemAsync(key))
      if (baseVal.number === 1) {
        return baseVal.value
      } else {
        let combinedVal = baseVal.value;
        for (let i = 0; i < baseVal.number; i++) {
          combinedVal += await SecureStore.getItemAsync(key + i);
        }
        return combinedVal;
      }
    },
    setItem: async (value) => {
      const stringified = JSON.stringify({
        number: 1,
        value: value
      });
      if (stringified.length <= STORAGE_LIMIT) {
        return await SecureStore.setItemAsync(key, stringified);
      } else {
        const numberOfChunks = Math.ceil(value.length / STORAGE_LIMIT);
        const chunks = [];
        for (let i = 0; i < numberOfChunks; i++) {
          chunks.push(value.substring(i * STORAGE_LIMIT, (i + 1) * STORAGE_LIMIT));
        }
        await SecureStore.setItemAsync(key, JSON.stringify({
          number: numberOfChunks,
          value: chunks[0]
        }));
        for (let i = 1; i < numberOfChunks; i++) {
          await SecureStore.setItemAsync(key + i, chunks[i]);
        }
      }
    },
    removeItem: () => {
      SecureStore.deleteItemAsync(key, ...args)
    },
  };
}