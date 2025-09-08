import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// Generic hook for API data fetching
export function useApi<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Specific hooks for each entity
export function useBrands() {
  return useApi(() => apiClient.getBrands(), []);
}

export function useProducts() {
  return useApi(() => apiClient.getProducts(), []);
}

export function useDealers() {
  return useApi(() => apiClient.getDealers(), []);
}

export function useQuotations() {
  return useApi(() => apiClient.getQuotations(), []);
}

export function useProductCategories() {
  return useApi(() => apiClient.getProductCategories(), []);
}

export function useProductFunctions() {
  return useApi(() => apiClient.getProductFunctions(), []);
}

export function useAreaRoomTypes() {
  return useApi(() => apiClient.getAreaRoomTypes(), []);
}

// Hook for single entity
export function useBrand(id: string) {
  return useApi(() => apiClient.getBrand(id), [id]);
}

export function useProduct(id: string) {
  return useApi(() => apiClient.getProduct(id), [id]);
}

export function useDealer(id: string) {
  return useApi(() => apiClient.getDealer(id), [id]);
}

export function useQuotation(id: string) {
  return useApi(() => apiClient.getQuotation(id), [id]);
}
