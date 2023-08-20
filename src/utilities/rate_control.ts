type Callback = (...args: any[]) => void;

export function eagerDebounce<T extends (...args: any) => any>(func: T, wait: number): T {
    let canUpdate: boolean = true;
    let shouldUpdate: boolean = false;
    let lastArgs: Parameters<T> | null = null;

    const debouncedFn = function (...args: Parameters<T>) {
        lastArgs = args;

        if (canUpdate) {
            func(...args);
            canUpdate = false;
            setTimeout(() => {
                canUpdate = true;
                if (shouldUpdate) {
                    debouncedFn(...(lastArgs as Parameters<T>));
                    shouldUpdate = false;
                }
            }, wait);
        } else {
            shouldUpdate = true;
        }
    } as T;

    return debouncedFn;
}

export function debounce(callback: Callback, wait: number): Callback & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFn = function (...args: any[]) {
        const later = () => {
            timeoutId = null;
            callback(...args);
        };

        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(later, wait);
    };

    debouncedFn.cancel = function () {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
}

export function throttle(callback: Callback, limit: number): Callback {
    let lastCall = 0;

    return function (...args: any[]) {
        const now = Date.now();

        if (now - lastCall >= limit) {
            lastCall = now;
            callback(...args);
        }
    };
}
