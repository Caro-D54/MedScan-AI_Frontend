import { apiClient } from './apiClient';
import type { User } from '@/types';

export interface AdminMetrics {
  totalUsers: number;
  regularUsers: number;
  adminUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalMedications: number;
  totalTreatments: number;
  totalDoses: number;
  uptimeSeconds: number;
}

export interface PagedUsersResponse {
  content: User[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  page?: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

/**
 * Obtiene las métricas generales del sistema (exclusivo para ADMIN).
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const response = await apiClient.get<AdminMetrics>('/admin/metrics');
  return response.data;
}

/**
 * Lista los usuarios registrados con soporte para paginación y búsqueda (exclusivo para ADMIN).
 */
export async function getAdminUsers(
  page: number = 0,
  size: number = 20,
  search?: string
): Promise<PagedUsersResponse> {
  const params: Record<string, string | number> = { page, size };
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await apiClient.get<PagedUsersResponse>('/admin/users', { params });
  const data = response.data;
  return {
    content: data.content || [],
    totalElements: data.page?.totalElements ?? data.totalElements ?? (data.content ? data.content.length : 0),
    totalPages: data.page?.totalPages ?? data.totalPages ?? 1,
    size: data.page?.size ?? data.size ?? size,
    number: data.page?.number ?? data.number ?? page,
    page: data.page,
  };
}

/**
 * Elimina un usuario por su ID (exclusivo para ADMIN).
 * El backend impide que un administrador se elimine a sí mismo.
 */
export async function deleteAdminUser(id: string | number): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}
