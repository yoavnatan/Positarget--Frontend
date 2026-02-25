import { useEffect, RefObject, Ref } from 'react';

function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void,
    excpetion: RefObject<T> | null = null
): void {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref?.current;
            const excpetionEl = excpetion?.current;

            if (!el || el.contains(event.target as Node) || (excpetionEl && excpetionEl.contains(event.target as Node))) {
                return;
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener); // תמיכה במובייל

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

export default useClickOutside;