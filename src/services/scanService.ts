import { apiClient } from './apiClient';

export interface ScanResult {
  medication: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  confidence?: number;
}

export function uploadScanImage(uri: string): Promise<ScanResult> {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'medication.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  return apiClient
    .post<ScanResult>('/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((response) => response.data);
}
