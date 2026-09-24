import { apiClient } from './apiClient';
import type { MedicationDraft } from '@/types/medication';
import type { DoseRecord, Medication } from '@/types';

export function listMedications(): Promise<Medication[]> {
  return apiClient.get<Medication[]>('/medications').then((response) => response.data);
}

export function getMedication(id: string): Promise<Medication> {
  return apiClient.get<Medication>(`/medications/${id}`).then((response) => response.data);
}

export function createMedication(draft: MedicationDraft): Promise<void> {
  return apiClient.post('/medications', draft);
}

export function updateMedication(id: string, draft: MedicationDraft): Promise<void> {
  return apiClient.put(`/medications/${id}`, draft);
}

export function deleteMedication(id: string): Promise<void> {
  return apiClient.delete(`/medications/${id}`);
}

export function markDoseAsTaken(medicationId: string, takenAt: string): Promise<DoseRecord> {
  return apiClient
    .post<DoseRecord>(`/medications/${medicationId}/doses`, { takenAt })
    .then((response) => response.data);
}

export async function saveMedicationFromScan(
  draft: MedicationDraft,
  photoUri: string | null,
): Promise<void> {
  const payload = photoUri ? { ...draft, imageUri: photoUri } : draft;
  await createMedication(payload);
}
