import { useCallback, useEffect, useState } from 'react';
import type { Medication } from '@/types';
import {
  scheduleMedicationReminders,
  cancelMedicationReminders,
  getMedicationReminderHours,
  requestNotificationPermission,
} from '@/services/notificationService';
import { markDoseAsTaken } from '@/services/medicationService';
import { parseFrequencyToHours } from '@/utils/frequency';

export type ToggleResult =
  | { ok: true }
  | { ok: false; reason: 'permission' | 'unparseable' | 'error' };

/**
 * Hook para gestionar los recordatorios y tomas de un medicamento específico.
 */
export function useMedicationReminder(medication: Medication | null) {
  const [scheduledHours, setScheduledHours] = useState<number[] | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isMarkingTaken, setIsMarkingTaken] = useState(false);

  const canSchedule = Boolean(
    medication && parseFrequencyToHours(medication.frequency) !== null,
  );

  const loadSchedule = useCallback(async () => {
    if (!medication?.id) {
      setScheduledHours(null);
      return;
    }
    const hours = await getMedicationReminderHours(medication.id);
    setScheduledHours(hours);
  }, [medication?.id]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const toggle = useCallback(
    async (enable: boolean): Promise<ToggleResult> => {
      if (!medication) {
        return { ok: false, reason: 'error' };
      }

      setIsToggling(true);
      try {
        if (enable) {
          const hasPermission = await requestNotificationPermission();
          if (!hasPermission) {
            return { ok: false, reason: 'permission' };
          }
          const schedule = await scheduleMedicationReminders(medication);
          if (!schedule) {
            return { ok: false, reason: 'unparseable' };
          }
          setScheduledHours(schedule.hours);
          return { ok: true };
        } else {
          await cancelMedicationReminders(medication.id);
          setScheduledHours(null);
          return { ok: true };
        }
      } catch {
        return { ok: false, reason: 'error' };
      } finally {
        setIsToggling(false);
      }
    },
    [medication],
  );

  const markTaken = useCallback(async (): Promise<boolean> => {
    if (!medication?.id) {
      return false;
    }
    setIsMarkingTaken(true);
    try {
      await markDoseAsTaken(medication.id, new Date().toISOString());
      return true;
    } catch {
      return false;
    } finally {
      setIsMarkingTaken(false);
    }
  }, [medication?.id]);

  return {
    isEnabled: (scheduledHours?.length ?? 0) > 0,
    scheduledHours,
    canSchedule,
    isToggling,
    isMarkingTaken,
    toggle,
    markTaken,
  };
}
