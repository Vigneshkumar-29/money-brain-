
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000, errorMessage = 'Request timed out'): Promise<T> => {
    let timeoutHandle: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([
        promise.then((result) => {
            clearTimeout(timeoutHandle);
            return result;
        }),
        timeoutPromise
    ]);
};

export const parseError = (error: any): string => {
    if (!error) return 'An unknown error occurred';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return JSON.stringify(error);
};
