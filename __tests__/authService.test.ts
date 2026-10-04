import { apiClient, setAuthToken } from '@/services/apiClient';
import {
  login,
  register,
  getCurrentUser,
  logout,
  getToken,
} from '@/services/authService';
import * as tokenStorage from '@/services/tokenStorage';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setAuthToken: jest.fn(),
}));

jest.mock('@/services/tokenStorage', () => ({
  getStoredToken: jest.fn(),
  storeToken: jest.fn(),
  clearStoredToken: jest.fn(),
}));

describe('authService (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('authenticates user, stores token, sets auth header, and returns normalized user', async () => {
      const mockBackendResponse = {
        data: {
          token: 'jwt-login-token-xyz',
          user: {
            id: 42,
            name: 'Carolina Gómez',
            email: 'caro@medscan.com',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockBackendResponse);

      const credentials = { email: 'caro@medscan.com', password: 'password123' };
      const user = await login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(tokenStorage.storeToken).toHaveBeenCalledWith('jwt-login-token-xyz');
      expect(setAuthToken).toHaveBeenCalledWith('jwt-login-token-xyz');
      expect(user).toEqual({
        id: '42',
        name: 'Carolina Gómez',
        email: 'caro@medscan.com',
      });
    });

    it('propagates error when login fails', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        login({ email: 'bad@medscan.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('sends sanitized payload without confirmPassword, stores token and returns user', async () => {
      const mockBackendResponse = {
        data: {
          token: 'jwt-register-token-abc',
          user: {
            id: 99,
            name: 'Nuevo Usuario',
            email: 'nuevo@medscan.com',
          },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockBackendResponse);

      const registerInput = {
        name: 'Nuevo Usuario',
        email: 'nuevo@medscan.com',
        password: 'securePass123',
        confirmPassword: 'securePass123',
      };

      const user = await register(registerInput);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Nuevo Usuario',
        email: 'nuevo@medscan.com',
        password: 'securePass123',
      });
      expect(tokenStorage.storeToken).toHaveBeenCalledWith('jwt-register-token-abc');
      expect(setAuthToken).toHaveBeenCalledWith('jwt-register-token-abc');
      expect(user).toEqual({
        id: '99',
        name: 'Nuevo Usuario',
        email: 'nuevo@medscan.com',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('fetches current user profile from /users/me and normalizes id to string', async () => {
      const mockResponse = {
        data: {
          id: 7,
          name: 'Usuario Logueado',
          email: 'logged@medscan.com',
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const user = await getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(user).toEqual({
        id: '7',
        name: 'Usuario Logueado',
        email: 'logged@medscan.com',
      });
    });
  });

  describe('logout & getToken', () => {
    it('clears stored token and resets auth token header on logout', async () => {
      await logout();

      expect(tokenStorage.clearStoredToken).toHaveBeenCalled();
      expect(setAuthToken).toHaveBeenCalledWith(null);
    });

    it('delegates getToken to tokenStorage', async () => {
      (tokenStorage.getStoredToken as jest.Mock).mockResolvedValueOnce('persisted-token');

      const token = await getToken();

      expect(tokenStorage.getStoredToken).toHaveBeenCalled();
      expect(token).toBe('persisted-token');
    });
  });
});
