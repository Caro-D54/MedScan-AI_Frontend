export type MedicationCategory = 'daily' | 'occasional';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  category: MedicationCategory;
  activeIngredient?: string;
  createdAt: string;
  doseId?: string;
  doseTaken?: boolean;
}

export interface MedicationEvent {
  id: string;
  medicationId: string;
  takenAt: string;
}

export interface Treatment {
  id: string;
  medication: Medication;
  startDate: string;
  endDate?: string;
  active: boolean;
}

export type Role = 'SYSTEM' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUri?: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  isLoggedIn?: boolean;
}
