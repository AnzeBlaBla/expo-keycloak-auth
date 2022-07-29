import { useRef, useCallback } from 'react';

import { useEffect } from 'react';


export default function useMounted() {
    const ref = useRef(false);

    useEffect(() => {
        ref.current = true;
        return () => {
            ref.current = false;
        };
    }, []);

    return useCallback(() => ref.current, [ref]);
}