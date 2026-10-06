import { getMedications, formatNextDoseTime } from '@/services/medicaments';
import { listMedications } from '@/services/medicationService';
import { getTreatments } from '@/services/treatmentService';

jest.mock('@/services/medicationService', () => ({
  listMedications: jest.fn(),
}));

jest.mock('@/services/treatmentService', () => ({
  getTreatments: jest.fn(),
  markDoseTaken: jest.fn(),
}));

describe('medicaments service (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatNextDoseTime', () => {
    it('formats ISO datetime to HH:mm hs', () => {
      const formatted = formatNextDoseTime('2026-10-06T14:30:00');
      expect(formatted).toMatch(/\d{2}:\d{2} hs/);
    });

    it('returns undefined for invalid or missing date strings', () => {
      expect(formatNextDoseTime(null)).toBeUndefined();
      expect(formatNextDoseTime(undefined)).toBeUndefined();
      expect(formatNextDoseTime('invalid-date')).toBeUndefined();
    });
  });

  describe('getMedications', () => {
    it('maps medications and enriches with next pending doseId from active treatments', async () => {
      (listMedications as jest.Mock).mockResolvedValueOnce([
        {
          id: '5',
          name: 'Amoxicilina',
          dosage: '500 mg',
          frequency: 'cada 8 horas',
          instructions: 'con comida',
        },
      ]);

      (getTreatments as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          medicationId: 5,
          doses: [
            {
              id: 201,
              scheduledAt: '2026-10-06T18:00:00',
              status: 'PENDING',
            },
            {
              id: 200,
              scheduledAt: '2026-10-06T10:00:00',
              status: 'TAKEN',
            },
          ],
        },
      ]);

      const result = await getMedications();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('5');
      expect(result[0].name).toBe('Amoxicilina');
      expect(result[0].doseId).toBe('201');
      expect(result[0].nextDose).toBeDefined();
    });

    it('falls back to medication id as doseId when no treatment exists', async () => {
      (listMedications as jest.Mock).mockResolvedValueOnce([
        {
          id: '7',
          name: 'Ibuprofeno',
          dosage: '400 mg',
          frequency: 'cada 6 horas',
          instructions: '',
        },
      ]);

      (getTreatments as jest.Mock).mockResolvedValueOnce([]);

      const result = await getMedications();

      expect(result).toHaveLength(1);
      expect(result[0].doseId).toBe('7');
      expect(result[0].nextDose).toBeUndefined();
    });

    it('returns empty array when listMedications returns non-array or throws', async () => {
      (listMedications as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getMedications();

      expect(result).toEqual([]);
    });
  });
});
