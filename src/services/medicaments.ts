import { listMedications } from './medicationService';
import { getTreatments, type TreatmentResponse, type DoseResponse } from './treatmentService';
import { isMedicationMarkedTaken } from './medicationEvents';
import type { Medication } from '@/types';

export function formatNextDoseTime(isoString?: string | null): string | undefined {
  if (!isoString) {
    return undefined;
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} hs`;
  } catch {
    return undefined;
  }
}

/**
 * Consulta la lista de medicamentos para las pantallas de Dashboard y Tratamientos.
 * Mapea los campos devueltos por el servicio base y los enriquece con las dosis pendientes de los tratamientos.
 */
export async function getMedications(): Promise<Medication[]> {
  try {
    const [meds, treatments] = await Promise.all([
      listMedications().catch((): Medication[] => []),
      getTreatments(true).catch(() => [] as TreatmentResponse[]),
    ]);

    if (!Array.isArray(meds)) {
      return [];
    }

    // Mapa de dosis pendientes y estado de dosis tomadas por medicationId
    const pendingDoseByMedId = new Map<string, DoseResponse>();
    const takenMedIds = new Set<string>();

    for (const treatment of treatments) {
      const medId = treatment.medicationId != null ? String(treatment.medicationId) : null;
      if (!medId) {
        continue;
      }

      const doses = treatment.doses ?? [];
      if (doses.some((d) => d.status === 'TAKEN')) {
        takenMedIds.add(medId);
      }

      const pendingDoses = doses
        .filter((d) => d.status === 'PENDING')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      if (pendingDoses.length > 0 && !pendingDoseByMedId.has(medId)) {
        pendingDoseByMedId.set(medId, pendingDoses[0]);
      }
    }

    return meds.map((item) => {
      const stringId = String(item.id);
      const pendingDose = pendingDoseByMedId.get(stringId);
      const isTaken = takenMedIds.has(stringId) || isMedicationMarkedTaken(stringId);

      return {
        ...item,
        id: stringId,
        dose: item.dosage,
        notes: item.instructions ?? '',
        withFood: item.withFood ?? false,
        doseId: pendingDose ? String(pendingDose.id) : undefined,
        doseTaken: isTaken,
        nextDose: pendingDose ? formatNextDoseTime(pendingDose.scheduledAt) : undefined,
      };
    });
  } catch {
    return [];
  }
}
