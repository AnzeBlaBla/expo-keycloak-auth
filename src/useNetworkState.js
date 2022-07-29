import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

const testFalseState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
}


export default function useNetworkState(onStateChange) {
    // Nastavimo na true, da ne breaka ostalih stvari - na začetku se predvideva, da je internet
    const [networkState, setNetworkState] = useState({
        isConnected: true,
        isInternetReachable: true,
        type: null,
    });


    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (onStateChange) {
                onStateChange(state);
            }
            setNetworkState(state);
        });

        return () => {
            unsubscribe();
        }
    }, []);

    return networkState;
}