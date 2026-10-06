import { apiClient } from '@/services/apiClient';
import {
  listMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  normalizeMedication,
  toBackendMedicationPayload,
} from '@/services/medicationService';
import type { MedicationDraft } from '@/types/medication';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('medicationService (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeMedication', () => {
    it('normalizes a backend Medicament model with numeric id and componentActive/secondaryEffect', () => {
      const backendMed = {
        id: 12,
        name: 'Amoxicilina',
        componentActive: 'Amoxicilina 500mg',
        secondaryEffect: 'Tomar cada 8 horas con comida',
        withFood: true,
        dangerousInteractions: 'Ninguna',
      };

      const result = normalizeMedication(backendMed);

      expect(result).toEqual({
        id: '12',
        name: 'Amoxicilina',
        dosage: 'Amoxicilina 500mg',
        frequency: '',
        instructions: 'Tomar cada 8 horas con comida',
      });
    });

    it('preserves existing frontend Medication properties when already present', () => {
      const frontendMed = {
        id: '99',
        name: 'Ibuprofeno',
        dosage: '400mg',
        frequency: 'Cada 6 horas',
        instructions: 'Con el almuerzo',
      };

      const result = normalizeMedication(frontendMed);

      expect(result).toEqual({
        id: '99',
        name: 'Ibuprofeno',
        dosage: '400mg',
        frequency: 'Cada 6 horas',
        instructions: 'Con el almuerzo',
      });
    });

    it('handles null and undefined attributes safely with defaults', () => {
      const result = normalizeMedication(null);

      expect(result).toEqual({
        id: '',
        name: '',
        dosage: '',
        frequency: '',
        instructions: '',
      });
    });
  });

  describe('toBackendMedicationPayload', () => {
    it('maps MedicationDraft into backend Medicament compatible payload', () => {
      const draft: MedicationDraft = {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Cada 8 horas',
        instructions: 'Tomar con abundante agua',
      };

      const payload = toBackendMedicationPayload(draft);

      expect(payload).toEqual({
        name: 'Paracetamol',
        componentActive: '500mg',
        secondaryEffect: 'Tomar con abundante agua',
        dosage: '500mg',
        frequency: 'Cada 8 horas',
        instructions: 'Tomar con abundante agua',
      });
    });
  });

  describe('listMedications', () => {
    it('unpacks Spring Data Page response and returns normalized Medication array', async () => {
      const pageResponse = {
        data: {
          content: [
            {
              id: 1,
              name: 'Losartán',
              componentActive: '50 mg',
              secondaryEffect: 'Por la mañana',
            },
            {
              id: 2,
              name: 'Metformina',
              componentActive: '850 mg',
              secondaryEffect: 'Con la cena',
            },
          ],
          totalElements: 2,
          totalPages: 1,
          size: 20,
          number: 0,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(pageResponse);

      const result = await listMedications();

      expect(apiClient.get).toHaveBeenCalledWith('/medications');
      expect(result).toEqual([
        {
          id: '1',
          name: 'Losartán',
          dosage: '50 mg',
          frequency: '',
          instructions: 'Por la mañana',
        },
        {
          id: '2',
          name: 'Metformina',
          dosage: '850 mg',
          frequency: '',
          instructions: 'Con la cena',
        },
      ]);
    });

    it('handles flat array responses seamlessly', async () => {
      const arrayResponse = {
        data: [
          {
            id: 3,
            name: 'Aspirina',
            dosage: '100mg',
            frequency: 'Diario',
            instructions: 'Después del desayuno',
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(arrayResponse);

      const result = await listMedications();

      expect(result).toEqual([
        {
          id: '3',
          name: 'Aspirina',
          dosage: '100mg',
          frequency: 'Diario',
          instructions: 'Después del desayuno',
        },
      ]);
    });

    it('returns empty array if response data is missing or empty', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: null });

      const result = await listMedications();

      expect(result).toEqual([]);
    });
  });

  describe('getMedication', () => {
    it('fetches medication by id and normalizes response from backend', async () => {
      const backendMed = {
        id: 7,
        name: 'Omeprazol',
        componentActive: '20 mg',
        secondaryEffect: 'En ayunas',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: backendMed });

      const result = await getMedication('7');

      expect(apiClient.get).toHaveBeenCalledWith('/medications/7');
      expect(result).toEqual({
        id: '7',
        name: 'Omeprazol',
        dosage: '20 mg',
        frequency: '',
        instructions: 'En ayunas',
      });
    });
  });

  describe('createMedication', () => {
    it('posts mapped backend payload for medication draft', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });

      const draft: MedicationDraft = {
        name: 'Sertralina',
        dosage: '50mg',
        frequency: '1 por noche',
        instructions: 'Al acostarse',
      };

      await createMedication(draft);

      expect(apiClient.post).toHaveBeenCalledWith('/medications', {
        name: 'Sertralina',
        componentActive: '50mg',
        secondaryEffect: 'Al acostarse',
        dosage: '50mg',
        frequency: '1 por noche',
        instructions: 'Al acostarse',
      });
    });
  });

  describe('updateMedication', () => {
    it('puts mapped backend payload for medication update', async () => {
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { id: 5 } });

      const draft: MedicationDraft = {
        name: 'Sertralina',
        dosage: '100mg',
        frequency: '1 por noche',
        instructions: 'Al acostarse con agua',
      };

      await updateMedication('5', draft);

      expect(apiClient.put).toHaveBeenCalledWith('/medications/5', {
        name: 'Sertralina',
        componentActive: '100mg',
        secondaryEffect: 'Al acostarse con agua',
        dosage: '100mg',
        frequency: '1 por noche',
        instructions: 'Al acostarse con agua',
      });
    });
  });

  describe('deleteMedication', () => {
    it('sends delete request to /medications/{id}', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: null });

      await deleteMedication('5');

      expect(apiClient.delete).toHaveBeenCalledWith('/medications/5');
    });
  });
});
