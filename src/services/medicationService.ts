import { apiClient } from './apiClient';
import type { MedicationDraft } from '@/types/medication';

export function createMedication(draft: MedicationDraft): Promise<void> {
  return apiClient.post('/medications', draft);
}

export async function saveMedicationFromScan(
  draft: MedicationDraft,
  photoUri: string | null,
): Promise<void> {
  const payload = photoUri ? { ...draft, imageUri: photoUri } : draft;
  await createMedication(payload);
}
