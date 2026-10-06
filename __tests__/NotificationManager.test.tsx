import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { NotificationManager } from '@/components/NotificationManager';
import { markDoseTaken } from '@/services/treatmentService';
import {
  MARK_TAKEN_ACTION_IDENTIFIER,
  configureNotifications,
  setupDoseReminderCategory,
  requestNotificationPermission,
  registerPushTokenWithBackend,
} from '@/services/notificationService';

const mockUseAuth = jest.fn();

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('expo-notifications', () => ({
  useLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/services/treatmentService', () => ({
  markDoseTaken: jest.fn(),
}));

jest.mock('@/services/notificationService', () => ({
  MARK_TAKEN_ACTION_IDENTIFIER: 'mark-taken',
  configureNotifications: jest.fn(),
  setupDoseReminderCategory: jest.fn(),
  requestNotificationPermission: jest.fn(),
  registerPushTokenWithBackend: jest.fn(),
}));

describe('NotificationManager (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('configures notifications and dose reminder category on mount', () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(null);

    act(() => {
      renderer.create(<NotificationManager />);
    });

    expect(configureNotifications).toHaveBeenCalled();
    expect(setupDoseReminderCategory).toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
  });

  it('marks dose taken using doseId from notification response data', async () => {
    const mockResponse = {
      actionIdentifier: MARK_TAKEN_ACTION_IDENTIFIER,
      notification: {
        request: {
          identifier: 'unique-response-1',
          content: {
            data: {
              doseId: '99',
              medicationId: '5',
            },
          },
        },
      },
    };

    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(mockResponse);
    (markDoseTaken as jest.Mock).mockResolvedValueOnce({ id: 99, status: 'TAKEN' });

    await act(async () => {
      renderer.create(<NotificationManager />);
    });

    expect(markDoseTaken).toHaveBeenCalledWith('99');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Toma registrada',
      'La toma quedó marcada como realizada.',
    );
  });

  it('navigates to url when default action identifier is triggered', async () => {
    const mockResponse = {
      actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          identifier: 'unique-response-2',
          content: {
            data: {
              url: '/medication/5',
            },
          },
        },
      },
    };

    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(mockResponse);

    await act(async () => {
      renderer.create(<NotificationManager />);
    });

    expect(router.push).toHaveBeenCalledWith('/medication/5');
  });

  it('synchronizes push token with backend when user is authenticated and permission is granted', async () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(null);
    mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com', name: 'Test' } });
    (requestNotificationPermission as jest.Mock).mockResolvedValueOnce(true);
    (registerPushTokenWithBackend as jest.Mock).mockResolvedValueOnce('ExponentPushToken[abc]');

    await act(async () => {
      renderer.create(<NotificationManager />);
    });

    expect(requestNotificationPermission).toHaveBeenCalled();
    expect(registerPushTokenWithBackend).toHaveBeenCalled();
  });

  it('does not register push token when user is authenticated but permission is denied', async () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(null);
    mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com', name: 'Test' } });
    (requestNotificationPermission as jest.Mock).mockResolvedValueOnce(false);

    await act(async () => {
      renderer.create(<NotificationManager />);
    });

    expect(requestNotificationPermission).toHaveBeenCalled();
    expect(registerPushTokenWithBackend).not.toHaveBeenCalled();
  });

  it('does not register push token when user is not authenticated', async () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(null);
    mockUseAuth.mockReturnValue({ user: null });

    await act(async () => {
      renderer.create(<NotificationManager />);
    });

    expect(requestNotificationPermission).not.toHaveBeenCalled();
    expect(registerPushTokenWithBackend).not.toHaveBeenCalled();
  });
});
