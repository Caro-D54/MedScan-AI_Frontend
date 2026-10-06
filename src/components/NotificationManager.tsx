import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';
import {
  MARK_TAKEN_ACTION_IDENTIFIER,
  configureNotifications,
  setupDoseReminderCategory,
} from '@/services/notificationService';
import { markDoseTaken } from '@/services/treatmentService';

const processedResponseIds = new Set<string>();

export function NotificationManager() {
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    configureNotifications();
    void setupDoseReminderCategory();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
  const medicationId = typeof data.medicationId === 'string' ? data.medicationId : null;
  const doseId = typeof data.doseId === 'string' || typeof data.doseId === 'number'
    ? String(data.doseId)
    : medicationId;
  const url = typeof data.url === 'string' ? data.url : null;

  if (response.actionIdentifier === MARK_TAKEN_ACTION_IDENTIFIER && doseId) {
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
  }

  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER && url) {
    router.push(url);
  }
}