import { useAuth as useCoreAuth } from '@/context/AuthContext';
import type { RegisterInput } from '@/types/auth';

/**
 * Adaptador de compatibilidad para las pantallas de UI (LoginScreen, RegisterScreen, ProfileScreen).
 * Conecta los métodos de alto nivel con el AuthProvider principal de la aplicación.
 */
export function useAuth() {
  const core = useCoreAuth();

  return {
    ...core,
    login: async (email: string, password: string) => {
      await core.signIn({ email, password });
    },
    register: async (input: Omit<RegisterInput, 'confirmPassword'> & { confirmPassword?: string }) => {
      await core.signUp({
        name: input.name,
        email: input.email,
        password: input.password,
        confirmPassword: input.confirmPassword ?? input.password,
      });
    },
    logout: async () => {
      await core.signOut();
    },
  };
}
