import { useCallback, useEffect, useState } from 'react';
import { listMedications } from '@/services/medicationService';
import type { Medication } from '@/types';

/**
 * Hook para consultar y refrescar la lista de medicamentos del usuario.
 */
export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMedications = useCallback(async () => {
    try {
      const data = await listMedications();
      setMedications(Array.isArray(data) ? data : []);
    } catch {
      setMedications([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchMedications().finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchMedications]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchMedications();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMedications]);

  return {
    medications,
    isLoading,
    isRefreshing,
    refresh,
  };
}
