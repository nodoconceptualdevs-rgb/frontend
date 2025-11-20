import { useState, useEffect, useCallback } from "react";
import { message } from "antd";

interface UseDataFetchOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showErrorMessage?: boolean;
}

export function useDataFetch<T = any>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseDataFetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError, showErrorMessage = true } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      if (showErrorMessage) {
        message.error(error.message || "Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, onSuccess, onError, showErrorMessage]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
