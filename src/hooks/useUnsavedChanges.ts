import { useEffect, useCallback, useRef } from 'react';

/**
 * Warns user when they try to leave the page with unsaved changes.
 * @param hasChanges - Whether there are unsaved changes
 */
export function useUnsavedChanges(hasChanges: boolean) {
    const hasChangesRef = useRef(hasChanges);
    hasChangesRef.current = hasChanges;

    const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
        if (hasChangesRef.current) {
            e.preventDefault();
        }
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [handleBeforeUnload]);
}
