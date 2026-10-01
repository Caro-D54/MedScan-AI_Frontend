import axios, { type AxiosInstance } from 'axios';

/**
 * URL base predeterminada para el backend Spring Boot de MedScan AI.
 * En emuladores Android suele emplearse http://10.0.2.2:8080/api/v1.
 * En simuladores iOS o web se emplea http://localhost:8080/api/v1.
 */
export const DEFAULT_API_URL = 'http://localhost:8080/api/v1';
export const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Determina y normaliza la URL base de la API.
 * - Elimina espacios y barras diagonales finales.
 * - En entornos que no son producción (tests, dev local), usa DEFAULT_API_URL como fallback seguro.
 * - En producción, exige explícitamente definir la variable de entorno.
 */
export function resolveApiBaseUrl(rawUrl?: string): string {
  const candidate = rawUrl?.trim();
  if (candidate) {
    return candidate.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('EXPO_PUBLIC_API_URL no está definida. Por favor configurá la variable de entorno en producción.');
  }

  return DEFAULT_API_URL;
}

const baseURL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Establece o elimina el token JWT Bearer en los encabezados globales de Axios.
 *
 * @param token - Token JWT válido o null/vacío para cerrar sesión.
 */
export function setAuthToken(token: string | null): void {
  if (token && token.trim().length > 0) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token.trim()}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
