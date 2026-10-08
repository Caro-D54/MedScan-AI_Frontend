export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  dose?: string;
  doseId?: string;
  nextDose?: string;
  nextDoseTime?: string;
  status?: string;
  type?: string;
  duration?: string;
  description?: string;
  interaction?: string;
  interactionDetail?: string;
  withFood?: boolean;
  withWater?: boolean;
  avoidAlcohol?: boolean;
  notes?: string;
  remaining?: number | string;
}


export interface DoseRecord {
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

export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
