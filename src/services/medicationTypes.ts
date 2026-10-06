/**
 * Definición de tipos de medicamentos utilizada por las pantallas visuales
 * y el catálogo de tratamientos.
 */
export interface Medication {
  id: string;
  name: string;
  type?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  description?: string;
  interaction?: string;
  interactionDetail?: string;
  withFood?: boolean;
  withWater?: boolean;
  avoidAlcohol?: boolean;
  notes?: string;
  nextDose?: string;
  status?: string;
  remaining?: number | string;
  doseId?: string;
}
