export interface MedicationDraft {
  name: string;
  activeIngredient?: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export type MedicationField = keyof MedicationDraft;
