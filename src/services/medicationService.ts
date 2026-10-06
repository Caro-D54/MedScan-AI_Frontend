import { apiClient } from './apiClient';
import { markDoseTaken } from './treatmentService';
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
  return {
    id: raw?.id != null ? String(raw.id) : '',
    name: raw?.name ?? '',
    dosage: raw?.dosage ?? raw?.componentActive ?? '',
    frequency: raw?.frequency ?? '',
    instructions: raw?.instructions ?? raw?.secondaryEffect ?? '',
  };
}

/**
 * Convierte un borrador de la UI a un payload compatible con la entidad Medicament del backend Spring Boot.
 */
export function toBackendMedicationPayload(
  draft: MedicationDraft & { imageUri?: string },
): BackendMedicationPayload {
  return {
    ...draft,
    name: draft.name,
    componentActive: draft.dosage,
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
): Promise<void> {
  const payload = toBackendMedicationPayload(draft);
  return apiClient.post('/medications', payload);
}

/**
 * Actualiza un medicamento existente mapeando el borrador al backend.
 */
export function updateMedication(
  id: string,
  draft: MedicationDraft & { imageUri?: string },
): Promise<void> {
  const payload = toBackendMedicationPayload(draft);
  return apiClient.put(`/medications/${id}`, payload);
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
  return markDoseTaken(doseId).then((dose) => ({
    id: String(dose.id),
    medicationId: doseId,
    takenAt,
  }));
}

export async function saveMedicationFromScan(
  draft: MedicationDraft,
  photoUri: string | null,
): Promise<void> {
  const payload = photoUri ? { ...draft, imageUri: photoUri } : draft;
  await createMedication(payload);
}
