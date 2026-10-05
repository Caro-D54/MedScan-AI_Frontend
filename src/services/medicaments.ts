import { listMedications } from './medicationService';
import type { Medication } from './medicationTypes';

/**
 * Consulta la lista de medicamentos para las pantallas de Dashboard y Tratamientos.
 * Mapea los campos devueltos por el servicio base a la interfaz Medication esperada.
 */
export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await listMedications();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => ({
      id: String(item.id),
      name: item.name,
      dose: (item as unknown as { dosage?: string }).dosage ?? '',
      frequency: item.frequency ?? '',
      notes: (item as unknown as { instructions?: string }).instructions ?? '',
      withFood: false,
    }));
  } catch {
    return [];
  }
}
