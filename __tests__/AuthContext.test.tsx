import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as authService from '@/services/authService';
import * as tokenStorage from '@/services/tokenStorage';
import * as apiClient from '@/services/apiClient';

jest.mock('@/services/authService');
jest.mock('@/services/tokenStorage');
jest.mock('@/services/apiClient');

describe('AuthContext (TDD)', () => {
  let capturedContext: ReturnType<typeof useAuth> | null = null;

  function TestConsumer() {
    capturedContext = useAuth();
    return null;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    capturedContext = null;
  });

  it('restores session when stored token is found and getCurrentUser succeeds', async () => {
    (tokenStorage.getStoredToken as jest.Mock).mockResolvedValueOnce('valid-token-123');
    (authService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      id: '10',
      name: 'Usuario Restaurado',
      email: 'restaurado@medscan.com',
    });

    await act(async () => {
      renderer.create(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    expect(apiClient.setAuthToken).toHaveBeenCalledWith('valid-token-123');
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(capturedContext?.isLoading).toBe(false);
    expect(capturedContext?.user).toEqual({
      id: '10',
      name: 'Usuario Restaurado',
      email: 'restaurado@medscan.com',
    });
  });

  it('clears session when stored token is invalid or expired', async () => {
    (tokenStorage.getStoredToken as jest.Mock).mockResolvedValueOnce('expired-token');
    (authService.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

    await act(async () => {
      renderer.create(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(capturedContext?.isLoading).toBe(false);
    expect(capturedContext?.user).toBeNull();
  });

  it('leaves user as null if no token is stored', async () => {
    (tokenStorage.getStoredToken as jest.Mock).mockResolvedValueOnce(null);

    await act(async () => {
      renderer.create(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    expect(authService.getCurrentUser).not.toHaveBeenCalled();
    expect(capturedContext?.isLoading).toBe(false);
    expect(capturedContext?.user).toBeNull();
  });

  it('updates user state upon successful signIn', async () => {
    (tokenStorage.getStoredToken as jest.Mock).mockResolvedValueOnce(null);
    const mockUser = { id: '1', name: 'Alex', email: 'alex@medscan.com' };
    (authService.login as jest.Mock).mockResolvedValueOnce(mockUser);

    await act(async () => {
      renderer.create(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await act(async () => {
      await capturedContext?.signIn({ email: 'alex@medscan.com', password: 'pass' });
    });

    expect(capturedContext?.user).toEqual(mockUser);
  });

  it('clears user state upon signOut', async () => {
    (tokenStorage.getStoredToken as jest.Mock).mockResolvedValueOnce(null);
    const mockUser = { id: '1', name: 'Alex', email: 'alex@medscan.com' };
    (authService.login as jest.Mock).mockResolvedValueOnce(mockUser);

    await act(async () => {
      renderer.create(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await act(async () => {
      await capturedContext?.signIn({ email: 'alex@medscan.com', password: 'pass' });
    });
    expect(capturedContext?.user).toEqual(mockUser);

    await act(async () => {
      await capturedContext?.signOut();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(capturedContext?.user).toBeNull();
  });
});
