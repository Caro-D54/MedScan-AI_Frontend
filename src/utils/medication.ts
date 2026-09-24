import type { ScanResult } from '@/services/scanService';
import type { MedicationDraft, MedicationField } from '@/types/medication';
import type { Medication } from '@/types';
import { isValidName } from './validation';

export function toMedicationDraft(scanResult: ScanResult): MedicationDraft {
  return {
    name: scanResult.medication,
    dosage: scanResult.dosage ?? '',
    frequency: scanResult.frequency ?? '',
    instructions: scanResult.instructions ?? '',
  };
}

export function validateMedicationDraft(draft: MedicationDraft): Partial<Record<MedicationField, string>> {
  const errors: Partial<Record<MedicationField, string>> = {};

  if (!isValidName(draft.name)) {
    errors.name = 'Ingresá el nombre del medicamento.';
  }

  return errors;
}

export function filterMedicationsByQuery(
  medications: Medication[],
  query: string,
): Medication[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return medications;
  }

  return medications.filter((medication) =>
    medication.name.toLowerCase().includes(normalizedQuery),
  );
}
