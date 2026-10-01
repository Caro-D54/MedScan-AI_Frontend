import { login, register, getCurrentUser, logout } from '@/services/authService';
import { apiClient, setAuthToken } from '@/services/apiClient';
import { storeToken, clearStoredToken } from '@/services/tokenStorage';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setAuthToken: jest.fn(),
}));

jest.mock('@/services/tokenStorage', () => ({
  storeToken: jest.fn(),
  clearStoredToken: jest.fn(),
  getStoredToken: jest.fn(),
}));

describe('authService (TDD)', () => {
  const mockUserFromBackend = {
    id: 1,
    name: 'Carolina',
    email: 'caro@medscan.com',
  };

  const mockAuthResponse = {
    token: 'jwt-token-xyz',
    user: mockUserFromBackend,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('authenticates user, stores token, sets header, and returns user with string id', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const credentials = { email: 'caro@medscan.com', password: 'secret123' };
      const user = await login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(storeToken).toHaveBeenCalledWith('jwt-token-xyz');
      expect(setAuthToken).toHaveBeenCalledWith('jwt-token-xyz');
      expect(user).toEqual({
        id: '1',
        name: 'Carolina',
        email: 'caro@medscan.com',
      });
    });
  });

  describe('register', () => {
    it('strips confirmPassword, registers user, stores token, and returns user', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const registerInput = {
        name: 'Carolina',
        email: 'caro@medscan.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      };

      const user = await register(registerInput);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Carolina',
        email: 'caro@medscan.com',
        password: 'secret123',
      });
      expect(storeToken).toHaveBeenCalledWith('jwt-token-xyz');
      expect(setAuthToken).toHaveBeenCalledWith('jwt-token-xyz');
      expect(user).toEqual({
        id: '1',
        name: 'Carolina',
        email: 'caro@medscan.com',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('fetches current user profile from /users/me and normalizes id', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockUserFromBackend });

      const profile = await getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(profile).toEqual({
        id: '1',
        name: 'Carolina',
        email: 'caro@medscan.com',
      });
    });
  });

  describe('logout', () => {
    it('clears stored token and resets auth token header', async () => {
      await logout();

      expect(clearStoredToken).toHaveBeenCalledTimes(1);
      expect(setAuthToken).toHaveBeenCalledWith(null);
    });
  });
});
