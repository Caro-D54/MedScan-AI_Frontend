import { useCallback, useEffect, useState } from 'react';
import type { Medication } from '@/types';
import {
  scheduleMedicationReminders,
  cancelMedicationReminders,
  getMedicationReminderHours,
  requestNotificationPermission,
} from '@/services/notificationService';
import { markDoseAsTaken } from '@/services/medicationService';
import { markMedicationTakenState, clearMedicationTakenState } from '@/services/medicationEvents';
import { createTreatment, getTreatments, markDoseTaken } from '@/services/treatmentService';
import { parseFrequencyToHours } from '@/utils/frequency';
import { isSameCalendarDay } from '@/utils/date';

export type ToggleResult =
  | { ok: true }
  | { ok: false; reason: 'permission' | 'unparseable' | 'error' };

async function resolveOrCreatePendingDoseId(medication: Medication): Promise<string | null> {
  if (medication.doseId && !medication.doseTaken) {
    return medication.doseId;
  }

  try {
    const treatments = await getTreatments(true);
    for (const treatment of treatments) {
      if (String(treatment.medicationId) === String(medication.id)) {
        const pendingDoses = (treatment.doses ?? [])
          .filter((d) => d.status === 'PENDING')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        if (pendingDoses.length > 0) {
          return String(pendingDoses[0].id);
        }
      }
    }

    const intervalHours = parseFrequencyToHours(medication.frequency) ?? 24;
    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const startTime = `${hours}:${minutes}:00`;

    const createdTreatment = await createTreatment({
      medicationId: Number(medication.id),
      startDate,
      endDate,
      intervalHours: Math.max(1, Math.round(intervalHours)),
      doseQuantity: 1,
      startTime,
    });

    const pendingDoses = (createdTreatment?.doses ?? [])
      .filter((d) => d.status === 'PENDING')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    if (pendingDoses.length > 0) {
      return String(pendingDoses[0].id);
    }
  } catch {
    return null;
  }

  return null;
}

async function resolveTakenDoseId(medication: Medication): Promise<string | null> {
  if (medication.lastTakenDoseId) {
    return medication.lastTakenDoseId;
  }
  if (medication.doseId && medication.doseTaken) {
    return medication.doseId;
  }

  try {
    const treatments = await getTreatments(true);
    for (const treatment of treatments) {
      if (String(treatment.medicationId) === String(medication.id)) {
        const takenDoses = (treatment.doses ?? [])
          .filter((d) => d.status === 'TAKEN' && isSameCalendarDay(d.scheduledAt, new Date()))
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        if (takenDoses.length > 0) {
          return String(takenDoses[0].id);
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Hook para gestionar los recordatorios y tomas de un medicamento específico.
 */
export function useMedicationReminder(medication: Medication | null) {
  const [scheduledHours, setScheduledHours] = useState<number[] | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isMarkingTaken, setIsMarkingTaken] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

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
    if (!medication) {
      return false;
    }
    setIsMarkingTaken(true);
    try {
      const doseId = await resolveOrCreatePendingDoseId(medication);
      if (doseId) {
        await markDoseAsTaken(doseId, new Date().toISOString());
      }
      markMedicationTakenState(medication.id);
      return true;
    } catch {
      markMedicationTakenState(medication.id);
      return true;
    } finally {
      setIsMarkingTaken(false);
    }
  }, [medication]);

  const undoTaken = useCallback(async (): Promise<boolean> => {
    if (!medication) {
      return false;
    }
    setIsUndoing(true);
    try {
      const doseId = await resolveTakenDoseId(medication);
      if (doseId) {
        await markDoseTaken(doseId, 'PENDING');
      }
      clearMedicationTakenState(medication.id);
      return true;
    } catch {
      clearMedicationTakenState(medication.id);
      return true;
    } finally {
      setIsUndoing(false);
    }
  }, [medication]);

  return {
    isEnabled: (scheduledHours?.length ?? 0) > 0,
    scheduledHours,
    canSchedule,
    isToggling,
    isMarkingTaken,
    isUndoing,
    toggle,
    markTaken,
    undoTaken,
  };
}
