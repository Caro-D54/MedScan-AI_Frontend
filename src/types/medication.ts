export interface MedicationDraft {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export type MedicationField = keyof MedicationDraft;
