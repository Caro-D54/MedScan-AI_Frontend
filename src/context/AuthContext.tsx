import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  getCurrentUser,
} from '@/services/authService';
import { getStoredToken } from '@/services/tokenStorage';
import { registerUnauthorizedHandler, setAuthToken } from '@/services/apiClient';
import type { LoginCredentials, RegisterInput } from '@/types/auth';
import type { User } from '@/types';

export type FlexibleRegisterInput = Omit<RegisterInput, 'confirmPassword'> & { confirmPassword?: string };

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  login: (credentialsOrEmail: LoginCredentials | string, password?: string) => Promise<void>;
  register: (input: FlexibleRegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser?: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await getStoredToken();
        if (token) {
          setAuthToken(token);
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        }
      } catch {
        await logoutRequest();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(async () => {
      await logoutRequest();
      setUser(null);
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const authenticatedUser = await loginRequest(credentials);
    setUser(authenticatedUser);
  }, []);

  const signUp = useCallback(async (input: RegisterInput): Promise<void> => {
    const authenticatedUser = await registerRequest(input);
    setUser(authenticatedUser);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await logoutRequest();
    setUser(null);
  }, []);

  const login = useCallback(
    async (credentialsOrEmail: LoginCredentials | string, password?: string): Promise<void> => {
      if (typeof credentialsOrEmail === 'string') {
        await signIn({ email: credentialsOrEmail, password: password ?? '' });
      } else {
        await signIn(credentialsOrEmail);
      }
    },
    [signIn],
  );

  const register = useCallback(
    async (input: FlexibleRegisterInput): Promise<void> => {
      await signUp({
        name: input.name,
        email: input.email,
        password: input.password,
        confirmPassword: input.confirmPassword ?? input.password,
      });
    },
    [signUp],
  );

  const logout = signOut;

  const updateUser = useCallback((updates: Partial<User>): void => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut, login, register, logout, updateUser }),
    [user, isLoading, signIn, signUp, signOut, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
