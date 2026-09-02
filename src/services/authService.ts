import { apiClient, setAuthToken } from './apiClient';
import { clearStoredToken, storeToken } from './tokenStorage';
import type { LoginCredentials, RegisterInput } from '@/types/auth';
import type { User } from '@/types';

interface AuthResponse {
  token: string;
  user: User;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

function toRegisterPayload(input: RegisterInput): RegisterPayload {
  const { confirmPassword, ...payload } = input;
  return payload;
}

async function authenticate(endpoint: string, credentials: LoginCredentials): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>(endpoint, credentials);
  await storeToken(data.token);
  setAuthToken(data.token);
  return data.user;
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
