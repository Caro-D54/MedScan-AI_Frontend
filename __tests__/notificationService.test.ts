import * as Notifications from 'expo-notifications';
import { apiClient } from '@/services/apiClient';
import {
  registerPushTokenWithBackend,
  requestNotificationPermission,
  configureNotifications,
  setupDoseReminderCategory,
} from '@/services/notificationService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    patch: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('notificationService (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerPushTokenWithBackend', () => {
    it('obtains Expo push token and sends PATCH /users/me/push-token when permission is granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'ExponentPushToken[mock-token-123]',
      });
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({ status: 204 });

      const token = await registerPushTokenWithBackend();

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(apiClient.patch).toHaveBeenCalledWith('/users/me/push-token', {
        pushToken: 'ExponentPushToken[mock-token-123]',
      });
      expect(token).toBe('ExponentPushToken[mock-token-123]');
    });

    it('returns null and skips backend call if permission is not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const token = await registerPushTokenWithBackend();

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
      expect(apiClient.patch).not.toHaveBeenCalled();
      expect(token).toBeNull();
    });

    it('returns null if Expo does not return a token string', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: null,
      });

      const token = await registerPushTokenWithBackend();

      expect(apiClient.patch).not.toHaveBeenCalled();
      expect(token).toBeNull();
    });

    it('handles api error gracefully without crashing', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'ExponentPushToken[mock-token-err]',
      });
      (apiClient.patch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const token = await registerPushTokenWithBackend();

      expect(apiClient.patch).toHaveBeenCalledWith('/users/me/push-token', {
        pushToken: 'ExponentPushToken[mock-token-err]',
      });
      expect(token).toBeNull();
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns true if permission is already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission if not already granted and returns outcome', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('configureNotifications and setupDoseReminderCategory', () => {
    it('configures notification handler and categories', async () => {
      configureNotifications();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();

      await setupDoseReminderCategory();
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        'dose-reminder',
        expect.any(Array),
      );
    });
  });
});
