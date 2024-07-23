import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_LIMIT = 2048; // Value is split up into chunks of 2048 bytes
const NUMBER_KEY = "_number";

export const setItem = async (value) => {
    if (value.length <= STORAGE_LIMIT) {
        return await SecureStore.setItemAsync(key, value);
    } else {
        const numberOfChunks = Math.ceil(value.length / STORAGE_LIMIT);
        await SecureStore.setItemAsync(key + NUMBER_KEY, numberOfChunks.toString());
        for (let i = 0; i < numberOfChunks; i++) {
            let thisChunk = value.substring(i * STORAGE_LIMIT, (i + 1) * STORAGE_LIMIT);
            await SecureStore.setItemAsync(key + '_' + i, thisChunk);
        }
    }
};

export const getItem = async () => {
    const numberOfChunksString = await SecureStore.getItemAsync(key + NUMBER_KEY);
    if (!numberOfChunksString) {
        return null;
    }
    const numberOfChunks = parseInt(numberOfChunksString);
    let value = '';
    for (let i = 0; i < numberOfChunks; i++) {
        let thisChunk = await SecureStore.getItemAsync(key + '_' + i);
        value += thisChunk;
    }
    return value;
};

export const removeItem = async () => {
    const numberOfChunksString = await SecureStore.getItemAsync(key + NUMBER_KEY);
    if (!numberOfChunksString) {
        return null;
    }
    const numberOfChunks = parseInt(numberOfChunksString);
    for (let i = 0; i < numberOfChunks; i++) {
        await SecureStore.deleteItemAsync(key + '_' + i);
    }
    await SecureStore.deleteItemAsync(key + NUMBER_KEY);
};

export default function useSecureStore(key) {
    return {
        setItem: useCallback(setItem, [key]),
        getItem: useCallback(getItem, [key]),
        removeItem: useCallback(removeItem, [key]),
    };
}