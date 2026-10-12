import { apiClient } from './apiClient';
import { createTreatment, markDoseTaken } from './treatmentService';
import { parseFrequencyToHours } from '@/utils/frequency';
import type { MedicationDraft } from '@/types/medication';
import type { DoseRecord, Medication } from '@/types';

export interface RawMedicament {
  id?: number | string | null;
  name?: string | null;
  componentActive?: string | null;
  secondaryEffect?: string | null;
  withFood?: boolean | null;
  dangerousInteractions?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  instructions?: string | null;
}

export interface BackendMedicationPayload {
  name: string;
  componentActive?: string;
  secondaryEffect?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  withFood?: boolean;
  dangerousInteractions?: string;
  [key: string]: unknown;
}

/**
 * Normaliza un medicamento proveniente de la API (con soporte para el modelo backend
 * Medicament con componentActive/secondaryEffect y IDs numéricos) al modelo frontend Medication.
 */
export function normalizeMedication(raw?: RawMedicament | null): Medication {
  const result: Medication = {
    id: raw?.id != null ? String(raw.id) : '',
    name: raw?.name ?? '',
    dosage: raw?.dosage ?? raw?.componentActive ?? '',
    frequency: raw?.frequency ?? '',
    instructions: raw?.instructions ?? raw?.secondaryEffect ?? '',
  };
  if (raw?.dosage != null && raw?.componentActive != null) {
    result.activeIngredient = raw.componentActive;
  }
  return result;
}

export { getMedications, formatNextDoseTime } from './medicaments';



/**
 * Convierte un borrador de la UI a un payload compatible con la entidad Medicament del backend Spring Boot.
 */
export function toBackendMedicationPayload(
  draft: MedicationDraft & { imageUri?: string },
): BackendMedicationPayload {
  const activeIngredient = draft.activeIngredient?.trim();
  return {
    ...draft,
    name: draft.name,
    componentActive: activeIngredient ? activeIngredient : draft.dosage,
    secondaryEffect: draft.instructions,
    dosage: draft.dosage,
    frequency: draft.frequency,
    instructions: draft.instructions,
  };
}

/**
 * Consulta la lista de medicamentos del usuario autenticado.
 * Soporta respuestas paginadas de Spring Data ({ content: [...] }) y listas planas.
 */
export function listMedications(): Promise<Medication[]> {
  return apiClient
    .get<RawMedicament[] | { content?: RawMedicament[] }>('/medications')
    .then((response) => {
      const data = response?.data;
      if (!data) {
        return [];
      }
      const rawList: RawMedicament[] = Array.isArray(data)
        ? data
        : Array.isArray(data.content)
          ? data.content
          : [];
      return rawList.map(normalizeMedication);
    });
}

/**
 * Obtiene el detalle de un medicamento por ID normalizado para la UI.
 */
export function getMedication(id: string): Promise<Medication> {
  return apiClient
    .get<RawMedicament>(`/medications/${id}`)
    .then((response) => normalizeMedication(response?.data));
}

/**
 * Crea un nuevo medicamento mapeando el borrador a la estructura esperada por el backend.
 */
export function createMedication(
  draft: MedicationDraft & { imageUri?: string },
): Promise<Medication> {
  const payload = toBackendMedicationPayload(draft);
  return apiClient
    .post<RawMedicament>('/medications', payload)
    .then((response) => normalizeMedication(response?.data));
}

/**
 * Actualiza un medicamento existente mapeando el borrador al backend.
 */
export function updateMedication(
  id: string,
  draft: MedicationDraft & { imageUri?: string },
): Promise<Medication> {
  const payload = toBackendMedicationPayload(draft);
  return apiClient
    .put<RawMedicament>(`/medications/${id}`, payload)
    .then((response) => normalizeMedication(response?.data));
}

/**
 * Elimina un medicamento por su ID.
 */
export function deleteMedication(id: string): Promise<void> {
  return apiClient.delete(`/medications/${id}`);
}

export function markDoseAsTaken(
  doseId: string,
  takenAt: string = new Date().toISOString(),
): Promise<DoseRecord> {
  if (!doseId) {
    return Promise.reject(new Error('doseId es requerido para registrar la toma.'));
  }
  return markDoseTaken(doseId).then((dose) => ({
    id: String(dose.id),
    medicationId: doseId,
    takenAt,
  }));
}

export async function saveMedicationFromScan(
  draft: MedicationDraft,
  photoUri: string | null,
): Promise<Medication> {
  const payload = photoUri ? { ...draft, imageUri: photoUri } : draft;
  const created = await createMedication(payload);

  const intervalHours = parseFrequencyToHours(draft.frequency);
  if (created?.id && intervalHours !== null && intervalHours > 0) {
    try {
      const now = new Date();
      const startDate = now.toISOString().slice(0, 10);
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const startTime = `${hours}:${minutes}:00`;

      await createTreatment({
        medicationId: Number(created.id),
        startDate,
        endDate,
        intervalHours: Math.max(1, Math.round(intervalHours)),
        doseQuantity: 1,
        startTime,
      });
    } catch {
      // Si la creación del tratamiento falla, el medicamento ya fue persistido correctamente
    }
  }

  return created;
}
