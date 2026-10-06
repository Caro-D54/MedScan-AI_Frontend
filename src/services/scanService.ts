import { apiClient } from './apiClient';

export interface ScanResult {
  brandName?: string;
  medication?: string;
  name?: string;
  activeIngredient?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  confidence?: number;
}

function inferFileInfo(uri: string): { name: string; type: string } {
  const isPng = uri.toLowerCase().endsWith('.png');
  return {
    name: isPng ? 'medication.png' : 'medication.jpg',
    type: isPng ? 'image/png' : 'image/jpeg',
  };
}

/**
 * Sube una imagen capturada al servicio de escaneo inteligente del backend (/scan/process)
 * usando multipart/form-data con la clave 'file' esperada por Spring Boot.
 */
export async function uploadScanImage(uri: string): Promise<ScanResult> {
  const { name, type } = inferFileInfo(uri);
  const formData = new FormData();
  formData.append('file', {
    uri,
    name,
    type,
  } as unknown as Blob);

  const response = await apiClient.post<ScanResult>('/scan/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = response?.data ?? {};
  const resolvedName =
    data.brandName ?? data.medication ?? data.name ?? data.activeIngredient ?? '';

  return {
    ...data,
    brandName: resolvedName,
    medication: resolvedName,
    name: resolvedName,
  };
}
