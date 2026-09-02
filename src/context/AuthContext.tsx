import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest, register as registerRequest, logout as logoutRequest } from '@/services/authService';
import { getStoredToken } from '@/services/tokenStorage';
import { setAuthToken } from '@/services/apiClient';
import type { LoginCredentials, RegisterInput } from '@/types/auth';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
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
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function signIn(credentials: LoginCredentials): Promise<void> {
    const authenticatedUser = await loginRequest(credentials);
    setUser(authenticatedUser);
  }

  async function signUp(input: RegisterInput): Promise<void> {
    const authenticatedUser = await registerRequest(input);
    setUser(authenticatedUser);
  }

  async function signOut(): Promise<void> {
    await logoutRequest();
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading],
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
