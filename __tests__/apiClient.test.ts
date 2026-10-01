import {
  apiClient,
  resolveApiBaseUrl,
  setAuthToken,
  DEFAULT_API_URL,
  DEFAULT_TIMEOUT_MS,
} from '@/services/apiClient';

describe('apiClient & Environment Configuration (TDD)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    setAuthToken(null);
  });

  describe('resolveApiBaseUrl', () => {
    it('returns provided valid URL without trailing slash', () => {
      const url = 'http://10.0.2.2:8080/api/v1/';
      expect(resolveApiBaseUrl(url)).toBe('http://10.0.2.2:8080/api/v1');
    });

    it('trims leading and trailing whitespace from the URL', () => {
      const url = '   http://localhost:8080/api/v1   ';
      expect(resolveApiBaseUrl(url)).toBe('http://localhost:8080/api/v1');
    });

    it('falls back to DEFAULT_API_URL when rawUrl is undefined in non-production', () => {
      process.env.NODE_ENV = 'test';
      expect(resolveApiBaseUrl(undefined)).toBe(DEFAULT_API_URL);
    });

    it('falls back to DEFAULT_API_URL when rawUrl is empty string in non-production', () => {
      process.env.NODE_ENV = 'development';
      expect(resolveApiBaseUrl('')).toBe(DEFAULT_API_URL);
    });

    it('throws descriptive error in production when rawUrl is not defined', () => {
      process.env.NODE_ENV = 'production';
      expect(() => resolveApiBaseUrl(undefined)).toThrow(
        /EXPO_PUBLIC_API_URL no está definida/,
      );
    });
  });

  describe('apiClient instance configuration', () => {
    it('configures default timeout correctly', () => {
      expect(apiClient.defaults.timeout).toBe(DEFAULT_TIMEOUT_MS);
    });

    it('configures Content-Type header to application/json', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('setAuthToken', () => {
    it('sets the Authorization Bearer header when token is provided', () => {
      const token = 'sample-jwt-token-123';
      setAuthToken(token);
      expect(apiClient.defaults.headers.common.Authorization).toBe(`Bearer ${token}`);
    });

    it('deletes the Authorization header when token is null', () => {
      setAuthToken('temporary-token');
      expect(apiClient.defaults.headers.common.Authorization).toBeDefined();

      setAuthToken(null);
      expect(apiClient.defaults.headers.common.Authorization).toBeUndefined();
    });

    it('deletes the Authorization header when token is empty string', () => {
      setAuthToken('temporary-token');
      setAuthToken('');
      expect(apiClient.defaults.headers.common.Authorization).toBeUndefined();
    });
  });
});
