import React, { useState, useEffect, useCallback, useRef, DependencyList } from 'react';

export type AsyncStatus = 'loading' | 'success' | 'error';

export interface UseAsyncDataOptions<T> {
  timeoutMs?: number;
  errorMessage?: string;
  timeoutMessage?: string;
  fallbackData?: T;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: DependencyList = [],
  options: UseAsyncDataOptions<T> = {}
) {
  const {
    timeoutMs = 15000,
    errorMessage = 'Não foi possível carregar os dados. Tenta novamente.',
    timeoutMessage = 'Isto está a demorar mais do que o esperado. Verifica a tua ligação ou tenta novamente.',
    fallbackData,
  } = options;

  const [data, setData] = useState<T | undefined>(fallbackData);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    setStatus('loading');
    setError(null);

    // 15s Safety timeout to prevent infinite loading
    timer = setTimeout(() => {
      if (!cancelled && status === 'loading') {
        console.warn('Safety timeout reached (15s) for async data load');
        setError(timeoutMessage);
        setStatus('error');
      }
    }, timeoutMs);

    async function load() {
      try {
        const result = await fetchFnRef.current();
        if (!cancelled) {
          if (timer) clearTimeout(timer);
          setData(result);
          setStatus('success');
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          if (timer) clearTimeout(timer);
          console.error('useAsyncData fetch error:', err);
          setError(err?.message || errorMessage);
          setStatus('error');
          if (fallbackData !== undefined) {
            setData(fallbackData);
          }
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reloadTrigger, ...deps]);

  return {
    data,
    setData,
    status,
    setStatus,
    error,
    setError,
    retry,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
  };
}
