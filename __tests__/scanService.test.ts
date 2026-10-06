import { apiClient } from '@/services/apiClient';
import { uploadScanImage } from '@/services/scanService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('scanService (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadScanImage', () => {
    it('sends file using "file" key to /scan/process endpoint with multipart/form-data', async () => {
      const mockBackendResponse = {
        data: {
          brandName: 'Amoxicilina',
          activeIngredient: 'Amoxicilina 500 mg',
          dosage: '500 mg cada 8 horas',
          frequency: 'cada 8 horas',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockBackendResponse);

      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      const result = await uploadScanImage('file://photo.jpg');

      // Verifica que la clave de FormData sea 'file' y no 'image'
      expect(appendSpy).toHaveBeenCalledWith(
        'file',
        expect.objectContaining({
          uri: 'file://photo.jpg',
          name: 'medication.jpg',
          type: 'image/jpeg',
        }),
      );
      expect(appendSpy).not.toHaveBeenCalledWith('image', expect.anything());

      // Verifica que el endpoint sea /scan/process
      expect(apiClient.post).toHaveBeenCalledWith(
        '/scan/process',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      // Verifica mapeo de brandName a medication y name
      expect(result.brandName).toBe('Amoxicilina');
      expect(result.medication).toBe('Amoxicilina');
      expect(result.name).toBe('Amoxicilina');
      expect(result.activeIngredient).toBe('Amoxicilina 500 mg');
      expect(result.dosage).toBe('500 mg cada 8 horas');
      expect(result.frequency).toBe('cada 8 horas');

      appendSpy.mockRestore();
    });

    it('preserves existing medication property if provided', async () => {
      const mockLegacyResponse = {
        data: {
          medication: 'Ibuprofeno',
          dosage: '400 mg',
          frequency: 'cada 8 horas',
          instructions: 'con comida',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockLegacyResponse);

      const result = await uploadScanImage('file://photo.jpg');

      expect(result.medication).toBe('Ibuprofeno');
      expect(result.name).toBe('Ibuprofeno');
      expect(result.brandName).toBe('Ibuprofeno');
      expect(result.dosage).toBe('400 mg');
      expect(result.instructions).toBe('con comida');
    });

    it('infers png image MIME type and file name for .png uri', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { brandName: 'Aspirina' },
      });

      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      const result = await uploadScanImage('file:///storage/sample.PNG');

      expect(appendSpy).toHaveBeenCalledWith(
        'file',
        expect.objectContaining({
          uri: 'file:///storage/sample.PNG',
          name: 'medication.png',
          type: 'image/png',
        }),
      );
      expect(result.name).toBe('Aspirina');

      appendSpy.mockRestore();
    });

    it('falls back to activeIngredient if brandName and medication are missing', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          activeIngredient: 'Paracetamol 500 mg',
          dosage: '1 comprimido',
        },
      });

      const result = await uploadScanImage('file://photo.jpg');

      expect(result.name).toBe('Paracetamol 500 mg');
      expect(result.brandName).toBe('Paracetamol 500 mg');
      expect(result.medication).toBe('Paracetamol 500 mg');
      expect(result.activeIngredient).toBe('Paracetamol 500 mg');
    });

    it('handles empty response gracefully without throwing', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: null });

      const result = await uploadScanImage('file://photo.jpg');

      expect(result).toEqual({
        brandName: '',
        medication: '',
        name: '',
      });
    });

    it('propagates error when apiClient.post rejects', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(uploadScanImage('file://photo.jpg')).rejects.toThrow('Network error');
    });
  });
});
