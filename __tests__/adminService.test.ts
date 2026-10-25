import { apiClient } from '@/services/apiClient';
import {
  getAdminMetrics,
  getAdminUsers,
  deleteAdminUser,
} from '@/services/adminService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('adminService (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminMetrics', () => {
    it('obtiene las métricas del sistema correctamente desde /admin/metrics', async () => {
      const mockMetrics = {
        totalUsers: 15,
        regularUsers: 13,
        adminUsers: 2,
        newUsersLast7Days: 4,
        newUsersLast30Days: 10,
        totalMedications: 8,
        totalTreatments: 12,
        totalDoses: 60,
        uptimeSeconds: 1234,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMetrics });

      const result = await getAdminMetrics();

      expect(apiClient.get).toHaveBeenCalledWith('/admin/metrics');
      expect(result).toEqual(mockMetrics);
    });

    it('propaga error cuando la petición de métricas falla', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Forbidden'));

      await expect(getAdminMetrics()).rejects.toThrow('Forbidden');
    });
  });

  describe('getAdminUsers', () => {
    it('obtiene lista de usuarios paginada y normaliza la respuesta con page anidado', async () => {
      const mockBackendResponse = {
        data: {
          content: [
            { id: '1', name: 'Paciente Uno', email: 'uno@test.com', role: 'USER' },
            { id: '2', name: 'Admin Dos', email: 'admin@test.com', role: 'SYSTEM' },
          ],
          page: {
            totalElements: 2,
            totalPages: 1,
            size: 10,
            number: 0,
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockBackendResponse);

      const result = await getAdminUsers(0, 10, 'test');

      expect(apiClient.get).toHaveBeenCalledWith('/admin/users', {
        params: { page: 0, size: 10, search: 'test' },
      });
      expect(result.content).toHaveLength(2);
      expect(result.totalElements).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('maneja paginación sin término de búsqueda', async () => {
      const mockBackendResponse = {
        data: {
          content: [{ id: '1', name: 'Paciente', email: 'p@test.com', role: 'USER' }],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          number: 0,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockBackendResponse);

      const result = await getAdminUsers(0, 20);

      expect(apiClient.get).toHaveBeenCalledWith('/admin/users', {
        params: { page: 0, size: 20 },
      });
      expect(result.totalElements).toBe(1);
    });
  });

  describe('deleteAdminUser', () => {
    it('llama al endpoint DELETE /admin/users/:id correctamente', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: null });

      await deleteAdminUser(5);

      expect(apiClient.delete).toHaveBeenCalledWith('/admin/users/5');
    });

    it('propaga error cuando falla la eliminación', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(
        new Error('No puedes eliminar tu propia cuenta de administrador')
      );

      await expect(deleteAdminUser(1)).rejects.toThrow(
        'No puedes eliminar tu propia cuenta de administrador'
      );
    });
  });
});
