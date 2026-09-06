import { useCallback, useEffect, useState } from 'react';
import {
  cancelMedicationReminders,
  getMedicationReminderHours,
  requestNotificationPermission,
  scheduleMedicationReminders,
} from '@/services/notificationService';
import { markDoseAsTaken } from '@/services/medicationService';
import { parseFrequencyToHours } from '@/utils/frequency';
import type { Medication } from '@/types';

export type ToggleReminderResult =
  | { ok: true }
  | { ok: false; reason: 'permission' | 'frequency' };

interface UseMedicationReminderResult {
  isEnabled: boolean;
  scheduledHours: number[];
  canSchedule: boolean;
  isToggling: boolean;
  isMarkingTaken: boolean;
  toggle: (enabled: boolean) => Promise<ToggleReminderResult>;
  markTaken: () => Promise<boolean>;
}

export function useMedicationReminder(
  medication: Medication | null,
): UseMedicationReminderResult {
  const [isEnabled, setIsEnabled] = useState(false);
  const [scheduledHours, setScheduledHours] = useState<number[]>([]);
  const [isToggling, setIsToggling] = useState(false);
  const [isMarkingTaken, setIsMarkingTaken] = useState(false);

  const canSchedule = medication !== null && parseFrequencyToHours(medication.frequency) !== null;

  const refreshState = useCallback(async () => {
    if (!medication) {
      return;
    }

    const hours = await getMedicationReminderHours(medication.id);
    setScheduledHours(hours ?? []);
    setIsEnabled(hours !== null);
  }, [medication]);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const toggle = useCallback(
    async (enabled: boolean): Promise<ToggleReminderResult> => {
      if (!medication) {
        return { ok: false, reason: 'frequency' };
      }

      setIsToggling(true);
      try {
        if (enabled) {
          if (!canSchedule) {
            return { ok: false, reason: 'frequency' };
          }

          const granted = await requestNotificationPermission();
          if (!granted) {
            return { ok: false, reason: 'permission' };
          }

          const schedule = await scheduleMedicationReminders(medication);
          if (!schedule) {
            return { ok: false, reason: 'frequency' };
          }

          setScheduledHours(schedule.hours);
          setIsEnabled(true);
          return { ok: true };
        }

        await cancelMedicationReminders(medication.id);
        setScheduledHours([]);
        setIsEnabled(false);
        return { ok: true };
      } finally {
        setIsToggling(false);
      }
    },
    [medication, canSchedule],
  );

  const markTaken = useCallback(async (): Promise<boolean> => {
    if (!medication) {
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
  }, [medication]);

  return { isEnabled, scheduledHours, canSchedule, isToggling, isMarkingTaken, toggle, markTaken };
}