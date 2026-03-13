import { useEffect, useRef } from 'react';

/**
 * Auto-saves data after a debounce period when it changes.
 * @param data - The data to save (will be compared by JSON serialization)
 * @param saveFn - The async function to call for saving
 * @param delay - Debounce delay in ms (default 2000)
 * @param enabled - Whether auto-save is enabled (default true)
 */
export function useAutoSave<T>(
    data: T,
    saveFn: (data: T) => Promise<void>,
    delay = 2000,
    enabled = true
) {
    const initialRef = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const saveFnRef = useRef(saveFn);
    saveFnRef.current = saveFn;

    // Capture initial state on mount
    useEffect(() => {
        initialRef.current = JSON.stringify(data);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!enabled || initialRef.current === null) return;

        const currentJson = JSON.stringify(data);
        // Don't save if unchanged from initial state
        if (currentJson === initialRef.current) return;

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            saveFnRef.current(data).catch(console.error);
        }, delay);

        return () => clearTimeout(timerRef.current);
    }, [data, delay, enabled]);
}
