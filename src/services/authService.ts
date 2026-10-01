import { apiClient, setAuthToken } from './apiClient';
import { clearStoredToken, getStoredToken, storeToken } from './tokenStorage';
import type { LoginCredentials, RegisterInput } from '@/types/auth';
import type { User } from '@/types';

export interface RawBackendUser {
  id: number | string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: RawBackendUser;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

function normalizeUser(rawUser: RawBackendUser): User {
  return {
    ...rawUser,
    id: String(rawUser.id),
  };
}

function toRegisterPayload(input: RegisterInput): RegisterPayload {
  const { confirmPassword, ...payload } = input;
  return payload;
}

async function authenticate(endpoint: string, payload: unknown): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>(endpoint, payload);
  await storeToken(data.token);
  setAuthToken(data.token);
  return normalizeUser(data.user);
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<RawBackendUser>('/users/me');
  return normalizeUser(data);
}

export async function getToken(): Promise<string | null> {
  return getStoredToken();
}

export function login(credentials: LoginCredentials): Promise<User> {
  return authenticate('/auth/login', credentials);
}

export function register(input: RegisterInput): Promise<User> {
  return authenticate('/auth/register', toRegisterPayload(input));
}

export async function logout(): Promise<void> {
  await clearStoredToken();
  setAuthToken(null);
}
