import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';
import {
  MARK_TAKEN_ACTION_IDENTIFIER,
  configureNotifications,
  setupDoseReminderCategory,
  requestNotificationPermission,
  registerPushTokenWithBackend,
} from '@/services/notificationService';
import { markDoseTaken } from '@/services/treatmentService';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

const processedResponseIds = new Set<string>();

function useOptionalAuth(): User | null {
  try {
    const auth = useAuth();
    return auth.user;
  } catch {
    return null;
  }
}

export function NotificationManager() {
  const user = useOptionalAuth();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    configureNotifications();
    void setupDoseReminderCategory().catch((error) => {
      console.warn('[NotificationManager] setupDoseReminderCategory error:', error);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (user) {
      void (async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
          await registerPushTokenWithBackend();
        }
      })();
    }
  }, [user]);

  useEffect(() => {
    if (lastResponse) {
      void handleResponse(lastResponse);
    }
  }, [lastResponse]);

  return null;
}

async function handleResponse(response: NotificationResponse): Promise<void> {
  const responseId = response.notification.request.identifier;
  if (processedResponseIds.has(responseId)) {
    return;
  }
  processedResponseIds.add(responseId);

  const data = response.notification.request.content.data ?? {};
  const medicationId = typeof data.medicationId === 'string' || typeof data.medicationId === 'number'
    ? String(data.medicationId)
    : null;
  const doseId = typeof data.doseId === 'string' || typeof data.doseId === 'number'
    ? String(data.doseId)
    : null;
  const url = typeof data.url === 'string'
    ? data.url
    : medicationId
      ? `/medication/${medicationId}`
      : null;

  if (response.actionIdentifier === MARK_TAKEN_ACTION_IDENTIFIER) {
    if (doseId) {
      try {
        await markDoseTaken(doseId);
        Alert.alert(
          'Toma registrada',
          'La toma quedó marcada como realizada.',
        );
      } catch {
        Alert.alert(
          'No se pudo registrar la toma',
          'Ocurrió un error. Podés marcarla desde el detalle del medicamento.',
        );
      }
    } else if (url) {
      router.push(url);
    }
  }

  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER && url) {
    router.push(url);
  }
}