import { apiClient } from '@/services/apiClient';
import {
  createTreatment,
  getTreatments,
  markDoseTaken,
  type CreateTreatmentPayload,
} from '@/services/treatmentService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('treatmentService (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTreatment', () => {
    it('sends POST /treatments with payload and returns created treatment', async () => {
      const payload: CreateTreatmentPayload = {
        medicationId: 5,
        startDate: '2026-10-06',
        endDate: '2026-10-13',
        intervalHours: 8,
        doseQuantity: 1,
        startTime: '08:00:00',
      };

      const mockResponse = {
        data: {
          id: 1,
          medicationId: 5,
          startDate: '2026-10-06',
          endDate: '2026-10-13',
          intervalHours: 8,
          doseQuantity: 1,
          startTime: '08:00:00',
          doses: [
            {
              id: 101,
              scheduledAt: '2026-10-06T08:00:00',
              status: 'PENDING',
              notifiedAt: null,
            },
          ],
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await createTreatment(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/treatments', payload);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTreatments', () => {
    it('fetches active treatments with activeOnly=true by default', async () => {
      const mockTreatments = [
        {
          id: 1,
          medicationId: 5,
          medicationName: 'Amoxicilina',
          startDate: '2026-10-06',
          endDate: '2026-10-13',
          intervalHours: 8,
          doseQuantity: 1,
          startTime: '08:00:00',
          doses: [],
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTreatments });

      const result = await getTreatments();

      expect(apiClient.get).toHaveBeenCalledWith('/treatments', {
        params: { activeOnly: true },
      });
      expect(result).toEqual(mockTreatments);
    });

    it('fetches all treatments when activeOnly=false is passed', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      const result = await getTreatments(false);

      expect(apiClient.get).toHaveBeenCalledWith('/treatments', {
        params: { activeOnly: false },
      });
      expect(result).toEqual([]);
    });

    it('returns empty array when response data is null or undefined', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: null });

      const result = await getTreatments();

      expect(result).toEqual([]);
    });
  });

  describe('markDoseTaken', () => {
    it('sends PATCH /treatments/doses/{id}/take with status TAKEN by default', async () => {
      const mockDoseResponse = {
        data: {
          id: 101,
          scheduledAt: '2026-10-06T08:00:00',
          status: 'TAKEN',
          notifiedAt: null,
        },
      };

      (apiClient.patch as jest.Mock).mockResolvedValueOnce(mockDoseResponse);

      const result = await markDoseTaken('101');

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/treatments/doses/101/take',
        { status: 'TAKEN' },
      );
      expect(result).toEqual(mockDoseResponse.data);
    });

    it('supports numeric doseId and custom status like SKIPPED', async () => {
      const mockDoseResponse = {
        data: {
          id: 102,
          scheduledAt: '2026-10-06T16:00:00',
          status: 'SKIPPED',
          notifiedAt: null,
        },
      };

      (apiClient.patch as jest.Mock).mockResolvedValueOnce(mockDoseResponse);

      const result = await markDoseTaken(102, 'SKIPPED');

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/treatments/doses/102/take',
        { status: 'SKIPPED' },
      );
      expect(result).toEqual(mockDoseResponse.data);
    });
  });
});
