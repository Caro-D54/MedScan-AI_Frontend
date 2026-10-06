import { apiClient } from './apiClient';

export type DoseStatus = 'PENDING' | 'TAKEN' | 'SKIPPED';

export interface CreateTreatmentPayload {
  medicationId: number | string;
  startDate: string;
  endDate: string;
  intervalHours: number;
  doseQuantity: number;
  startTime: string;
}

export interface DoseResponse {
  id: number | string;
  scheduledAt: string;
  status: DoseStatus;
  notifiedAt?: string | null;
}

export interface TreatmentResponse {
  id: number | string;
  medicationId?: number | string;
  medicationName?: string;
  startDate: string;
  endDate: string;
  intervalHours: number;
  doseQuantity: number;
  startTime: string;
  doses: DoseResponse[];
}

/**
 * Crea un nuevo tratamiento médico en el backend (/api/v1/treatments).
 * Genera automáticamente el calendario de dosis programadas.
 */
export function createTreatment(payload: CreateTreatmentPayload): Promise<TreatmentResponse> {
  return apiClient
    .post<TreatmentResponse>('/treatments', payload)
    .then((response) => response.data);
}

/**
 * Consulta los tratamientos registrados del usuario en el backend (/api/v1/treatments).
 */
export function getTreatments(activeOnly = true): Promise<TreatmentResponse[]> {
  return apiClient
    .get<TreatmentResponse[]>('/treatments', { params: { activeOnly } })
    .then((response) => response.data ?? []);
}

/**
 * Marca una dosis como tomada (o saltada) usando el endpoint oficial del backend:
 * PATCH /api/v1/treatments/doses/{id}/take con { status: 'TAKEN' }.
 */
export function markDoseTaken(
  doseId: string | number,
  status: DoseStatus = 'TAKEN',
): Promise<DoseResponse> {
  return apiClient
    .patch<DoseResponse>(`/treatments/doses/${doseId}/take`, { status })
    .then((response) => response.data);
}
