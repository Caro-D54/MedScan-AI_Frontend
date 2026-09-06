import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { buildDailyReminderHours, parseFrequencyToHours } from '@/utils/frequency';
import type { Medication } from '@/types';

const REMINDER_CHANNEL_ID = 'dose-reminders';
const REMINDER_CATEGORY_ID = 'dose-reminder';
export const MARK_TAKEN_ACTION_IDENTIFIER = 'mark-taken';
const SCHEDULE_STORAGE_KEY = 'medication_reminders';

interface StoredSchedule {
  hours: number[];
  notificationIds: string[];
}

type SchedulesByMedication = Record<string, StoredSchedule>;

function isWeb(): boolean {
  return typeof window !== 'undefined';
}

export function configureNotifications(): void {
  if (isWeb()) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function setupDoseReminderCategory(): Promise<void> {
  if (isWeb()) {
    return;
  }

  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
    {
      identifier: MARK_TAKEN_ACTION_IDENTIFIER,
      buttonTitle: 'Marcar tomada',
    },
  ]);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb()) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function scheduleMedicationReminders(
  medication: Medication,
): Promise<StoredSchedule | null> {
  if (isWeb()) {
    return null;
  }

  const frequencyInHours = parseFrequencyToHours(medication.frequency);
  if (frequencyInHours === null) {
    return null;
  }

  await cancelMedicationReminders(medication.id);
  await ensureAndroidChannel();

  const timesPerDay = 24 / frequencyInHours;
  const hours = buildDailyReminderHours(timesPerDay, new Date());
  const notificationIds: string[] = [];

  for (const hour of hours) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de tu medicamento',
        body: medication.dosage ? `${medication.name} — ${medication.dosage}` : medication.name,
        categoryIdentifier: REMINDER_CATEGORY_ID,
        data: {
          medicationId: medication.id,
          url: `/medication/${medication.id}`,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: REMINDER_CHANNEL_ID,
        hour,
        minute: 0,
      },
    });
    notificationIds.push(notificationId);
  }

  const schedule = { hours, notificationIds };
  await storeSchedule(medication.id, schedule);
  return schedule;
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  if (isWeb()) {
    return;
  }

  const schedules = await readSchedules();
  const schedule = schedules[medicationId];

  if (!schedule) {
    return;
  }

  for (const notificationId of schedule.notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  delete schedules[medicationId];
  await persistSchedules(schedules);
}

export async function getMedicationReminderHours(
  medicationId: string,
): Promise<number[] | null> {
  if (isWeb()) {
    return null;
  }

  const schedules = await readSchedules();
  return schedules[medicationId]?.hours ?? null;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Recordatorios de tomas',
    importance: Notifications.AndroidImportance.MAX,
  });
}

async function storeSchedule(medicationId: string, schedule: StoredSchedule): Promise<void> {
  const schedules = await readSchedules();
  schedules[medicationId] = schedule;
  await persistSchedules(schedules);
}

async function readSchedules(): Promise<SchedulesByMedication> {
  const raw = await SecureStore.getItemAsync(SCHEDULE_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SchedulesByMedication) : {};
}

async function persistSchedules(schedules: SchedulesByMedication): Promise<void> {
  await SecureStore.setItemAsync(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
}