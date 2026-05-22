import { useState, useCallback, useEffect, useRef } from 'react';

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
  const asyncFunctionRef = useRef(asyncFunction);
  const optionsRef = useRef(options);

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: options.immediate !== false,
    error: null,
  });

  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
    optionsRef.current = options;
  }, [asyncFunction, options]);

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunctionRef.current();

      if (result.error) {
        const errorMsg = result.error || 'Unknown error';
        setState({ data: null, loading: false, error: errorMsg });
        optionsRef.current.onError?.(result.error);
      } else {
        setState({ data: result.data, loading: false, error: null });
        optionsRef.current.onSuccess?.(result.data);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      setState({ data: null, loading: false, error: errorMsg });
      optionsRef.current.onError?.(error);
    }
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, options.immediate]);

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
