import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listMedications } from '@/services/medicationService';
import type { Medication } from '@/types';

interface UseMedicationsResult {
  medications: Medication[];
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

export function useMedications(): UseMedicationsResult {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const fetchMedications = useCallback(async (showFullScreenLoading: boolean) => {
    if (showFullScreenLoading) {
      setIsLoading(true);
    }

    try {
      const data = await listMedications();
      setMedications(data);
      hasLoadedOnce.current = true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchMedications(!hasLoadedOnce.current);
    }, [fetchMedications]),
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchMedications(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMedications]);

  return { medications, isLoading, isRefreshing, refresh };
}