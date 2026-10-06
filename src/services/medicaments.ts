import { listMedications } from './medicationService';
import { getTreatments, type TreatmentResponse, type DoseResponse } from './treatmentService';
import type { Medication } from './medicationTypes';

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
      listMedications().catch(() => [] as any),
      getTreatments(true).catch(() => [] as TreatmentResponse[]),
    ]);

    if (!Array.isArray(meds)) {
      return [];
    }

    // Mapa de dosis pendientes por medicationId
    const pendingDoseByMedId = new Map<string, DoseResponse>();
    for (const treatment of treatments) {
      const medId = treatment.medicationId != null ? String(treatment.medicationId) : null;
      if (!medId) {
        continue;
      }

      const pendingDoses = (treatment.doses ?? [])
        .filter((d) => d.status === 'PENDING')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      if (pendingDoses.length > 0 && !pendingDoseByMedId.has(medId)) {
        pendingDoseByMedId.set(medId, pendingDoses[0]);
      }
    }

    return meds.map((item) => {
      const stringId = String(item.id);
      const pendingDose = pendingDoseByMedId.get(stringId);

      return {
        id: stringId,
        name: item.name,
        dose: (item as unknown as { dosage?: string }).dosage ?? '',
        frequency: item.frequency ?? '',
        notes: (item as unknown as { instructions?: string }).instructions ?? '',
        withFood: false,
        doseId: pendingDose ? String(pendingDose.id) : stringId,
        nextDose: pendingDose ? formatNextDoseTime(pendingDose.scheduledAt) : undefined,
      };
    });
  } catch {
    return [];
  }
}
