import { useState, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useAsync = <T,>(
  asyncFunction: () => Promise<any>,
  options: UseAsyncOptions = { immediate: true }
): UseAsyncState<T> & { retry: () => void } => {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: options.immediate !== false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunction();

      if (result.error) {
        const errorMsg = result.error || 'Unknown error';
        setState({ data: null, loading: false, error: errorMsg });
        options.onError?.(result.error);
      } else {
        setState({ data: result.data, loading: false, error: null });
        options.onSuccess?.(result.data);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      setState({ data: null, loading: false, error: errorMsg });
      options.onError?.(error);
    }
  }, [asyncFunction, options]);

  return { ...state, retry: execute };
};

export const useFetch = <T,>(
  url: string,
  options?: RequestInit
): UseAsyncState<T> & { retry: () => void } => {
  return useAsync<T>(
    () =>
      fetch(url, options)
        .then((res) => res.json())
        .catch((err) => ({ error: err.message })),
    { immediate: true }
  );
};
