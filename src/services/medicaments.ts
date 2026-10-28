import { listMedications } from './medicationService';
import { getTreatments, createTreatment, type TreatmentResponse, type DoseResponse } from './treatmentService';
import { parseFrequencyToHours } from '@/utils/frequency';
import { isSameCalendarDay, formatTimeFromIso } from '@/utils/date';
import type { Medication, PendingDose } from '@/types';

export function formatNextDoseTime(isoString?: string | null): string | undefined {
  return formatTimeFromIso(isoString);
}

/**
 * Asegura que los medicamentos con frecuencia tengan su tratamiento correspondiente
 * en el backend para poder rastrear y registrar cada toma con su ID y horario real.
 */
async function ensureTreatmentsForMedications(
  meds: Medication[],
  treatments: TreatmentResponse[],
): Promise<TreatmentResponse[]> {
  const existingTreatmentMedIds = new Set(
    treatments.map((t) => (t.medicationId != null ? String(t.medicationId) : '')),
  );

  const missingMeds = meds.filter(
    (m) => m.id && !existingTreatmentMedIds.has(String(m.id)),
  );

  if (missingMeds.length === 0) {
    return treatments;
  }

  const updatedTreatments = [...treatments];

  for (const med of missingMeds) {
    const intervalHours = parseFrequencyToHours(med.frequency) ?? 8;
    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const startTime = `${hours}:${minutes}:00`;

    try {
      const created = await createTreatment({
        medicationId: Number(med.id),
        startDate,
        endDate,
        intervalHours: Math.max(1, Math.round(intervalHours)),
        doseQuantity: 1,
        startTime,
      });
      if (created) {
        updatedTreatments.push(created);
      }
    } catch {
      // Ignorar fallo puntual para no bloquear la carga principal
    }
  }

  return updatedTreatments;
}

/**
 * Consulta la lista de dosis pendientes organizadas por día.
 * Por defecto filtra estrictamente por el día actual (targetDate).
 * Si ya se tomaron todas las dosis del día indicado, devuelve un array vacío [].
 */
export async function getPendingDoses(targetDate: Date = new Date()): Promise<PendingDose[]> {
  try {
    const [meds, rawTreatments] = await Promise.all([
      listMedications().catch((): Medication[] => []),
      getTreatments(true).catch(() => [] as TreatmentResponse[]),
    ]);

    if (!Array.isArray(meds) || meds.length === 0) {
      return [];
    }

    const treatments = await ensureTreatmentsForMedications(meds, rawTreatments);
    const medMap = new Map<string, Medication>(meds.map((m) => [String(m.id), m]));
    const pendingList: PendingDose[] = [];

    for (const treatment of treatments) {
      const medId = treatment.medicationId != null ? String(treatment.medicationId) : null;
      if (!medId) {
        continue;
      }

      const med = medMap.get(medId);
      const medName = med?.name ?? treatment.medicationName ?? 'Medicamento';
      const dosage = med?.dosage ?? '';
      const withFood = med?.withFood ?? false;

      const doses = treatment.doses ?? [];

      // Filtramos únicamente las dosis PENDING programadas para el día objetivo (targetDate)
      const dayPendingDoses = doses.filter(
        (d) => d.status === 'PENDING' && isSameCalendarDay(d.scheduledAt, targetDate),
      );

      // Agregamos todas las tomas pendientes que correspondan a ese día
      for (const dose of dayPendingDoses) {
        const scheduledTimeStr = formatTimeFromIso(dose.scheduledAt) ?? 'Horario pendiente';

        pendingList.push({
          id: String(dose.id),
          treatmentId: treatment.id != null ? String(treatment.id) : undefined,
          medicationId: medId,
          medicationName: medName,
          dosage,
          scheduledAt: dose.scheduledAt,
          scheduledTime: scheduledTimeStr,
          intervalHours: treatment.intervalHours,
          withFood,
          status: 'PENDING',
        });
      }
    }

    // Ordenar todas las dosis pendientes del día cronológicamente
    return pendingList.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  } catch {
    return [];
  }
}

/**
 * Consulta la lista de medicamentos para las pantallas de Dashboard y Tratamientos.
 * Evalúa si el medicamento tiene dosis pendientes para el día indicado (targetDate).
 * Si no tiene dosis pendientes para ese día (o ya fueron tomadas), se marca como al día (doseTaken: true).
 */
export async function getMedications(targetDate: Date = new Date()): Promise<Medication[]> {
  try {
    const [meds, rawTreatments] = await Promise.all([
      listMedications().catch((): Medication[] => []),
      getTreatments(true).catch(() => [] as TreatmentResponse[]),
    ]);

    if (!Array.isArray(meds)) {
      return [];
    }

    const treatments = await ensureTreatmentsForMedications(meds, rawTreatments);

    // Mapeo por medicamento de dosis pendientes del día y dosis tomadas del día
    const pendingDosesTodayByMedId = new Map<string, DoseResponse[]>();
    const takenDosesTodayByMedId = new Map<string, DoseResponse[]>();

    for (const treatment of treatments) {
      const medId = treatment.medicationId != null ? String(treatment.medicationId) : null;
      if (!medId) {
        continue;
      }

      const doses = treatment.doses ?? [];
      const dayDoses = doses.filter((d) => isSameCalendarDay(d.scheduledAt, targetDate));
      const pendingToday = dayDoses
        .filter((d) => d.status === 'PENDING')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      const takenToday = dayDoses
        .filter((d) => d.status === 'TAKEN')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

      if (!pendingDosesTodayByMedId.has(medId)) {
        pendingDosesTodayByMedId.set(medId, []);
      }
      pendingDosesTodayByMedId.get(medId)!.push(...pendingToday);

      if (!takenDosesTodayByMedId.has(medId)) {
        takenDosesTodayByMedId.set(medId, []);
      }
      takenDosesTodayByMedId.get(medId)!.push(...takenToday);
    }

    return meds.map((item) => {
      const stringId = String(item.id);
      const pendingList = (pendingDosesTodayByMedId.get(stringId) ?? []).sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      const takenList = (takenDosesTodayByMedId.get(stringId) ?? []).sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      );
      const nextPendingDose = pendingList[0];
      const lastTakenDose = takenList[0];

      // Si tiene dosis pendientes en el día, aún NO está tomada (doseTaken = false).
      // Si no tiene ninguna dosis pendiente hoy (todas las del día fueron tomadas), está al día (doseTaken = true).
      const hasPendingToday = Boolean(nextPendingDose);
      const isTaken = !hasPendingToday;

      return {
        ...item,
        id: stringId,
        dose: item.dosage,
        notes: item.instructions ?? '',
        withFood: item.withFood ?? false,
        doseId: nextPendingDose ? String(nextPendingDose.id) : (lastTakenDose ? String(lastTakenDose.id) : undefined),
        lastTakenDoseId: lastTakenDose ? String(lastTakenDose.id) : undefined,
        doseTaken: isTaken,
        nextDose: nextPendingDose ? formatTimeFromIso(nextPendingDose.scheduledAt) : undefined,
      };
    });
  } catch {
    return [];
  }
}
