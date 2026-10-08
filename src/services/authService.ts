import { apiClient, setAuthToken } from './apiClient';
import { clearStoredToken, getStoredToken, storeToken } from './tokenStorage';
import type { LoginCredentials, RegisterInput } from '@/types/auth';
import type { User } from '@/types';

/**
 * Representación del usuario tal como lo expone la API de Spring Boot.
 * Permite compatibilidad con IDs numéricos (Long) serializados en JSON.
 */
interface BackendUser {
  id: string | number;
  name: string;
  email: string;
  role?: 'ADMIN' | 'USER';
}

interface AuthResponse {
  token: string;
  user: BackendUser;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * Normaliza los datos del usuario asegurando que el identificador sea siempre tipo string,
 * conforme a la interfaz User del frontend.
 */
function normalizeUser(rawUser: BackendUser): User {
  return {
    id: String(rawUser.id),
    name: rawUser.name,
    email: rawUser.email,
    role: rawUser.role ?? 'USER',
  };
}

function toRegisterPayload(input: RegisterInput): RegisterPayload {
  const { confirmPassword, ...payload } = input;
  return payload;
}

async function authenticate(
  endpoint: string,
  payload: LoginCredentials | RegisterPayload,
): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>(endpoint, payload);
  await storeToken(data.token);
  setAuthToken(data.token);
  return normalizeUser(data.user);
}

/**
 * Obtiene el token JWT persistido en el almacenamiento seguro.
 */
export async function getToken(): Promise<string | null> {
  return getStoredToken();
}

/**
 * Autentica un usuario con email y contraseña.
 */
export function login(credentials: LoginCredentials): Promise<User> {
  return authenticate('/auth/login', credentials);
}

/**
 * Registra un nuevo usuario en el sistema.
 */
export function register(input: RegisterInput): Promise<User> {
  return authenticate('/auth/register', toRegisterPayload(input));
}

/**
 * Consulta el perfil del usuario autenticado actual desde el backend.
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<BackendUser>('/users/me');
  return normalizeUser(data);
}

/**
 * Cierra la sesión activa en el cliente y elimina las credenciales locales.
 */
export async function logout(): Promise<void> {
  await clearStoredToken();
  setAuthToken(null);
}
