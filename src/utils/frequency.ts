const SPANISH_NUMBERS: Record<string, number> = {
  una: 1,
  un: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
};

const MAX_DAILY_REMINDERS = 6;

export function parseFrequencyToHours(frequency: string): number | null {
  const normalized = frequency.trim().toLowerCase();

  if (!normalized || /\d\s*-\s*\d/.test(normalized)) {
    return null;
  }

  const timesPerDay = parseTimesPerDay(normalized);
  if (timesPerDay !== null) {
    return 24 / timesPerDay;
  }

  if (/cada\s*d[íi]a|diaria|diario/.test(normalized)) {
    return 24;
  }

  const minutes = parseEveryMinutes(normalized);
  if (minutes !== null) {
    return minutes;
  }

  if (/cada\s*hora/.test(normalized)) {
    return 1;
  }

  return parseEveryHours(normalized);
}

function parseTimesPerDay(frequency: string): number | null {
  const match = frequency.match(
    /(\d+|[a-z]+)\s*ve(?:z|ces?)\s*(?:al|por)\s*d[íi]a/,
  );
  if (!match) {
    return null;
  }

  const count = parseCount(match[1]);
  return count !== null && count > 0 ? count : null;
}

function parseEveryMinutes(frequency: string): number | null {
  const match = frequency.match(/cada\s+(\d+(?:\.\d+)?)\s*m(?:in(?:utos?)?)?/);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  return minutes > 0 ? minutes / 60 : null;
}

function parseEveryHours(frequency: string): number | null {
  const bareHours = frequency.match(/^(\d+(?:\.\d+)?)\s*(?:h(?:oras?)?|hs?)?$/);
  if (bareHours) {
    const hours = Number(bareHours[1]);
    return hours > 0 ? hours : null;
  }

  const prefixedHours = frequency.match(/cada\s+(\d+(?:\.\d+)?)\s*(?:h(?:oras?)?|hs?)?/);
  if (prefixedHours) {
    const hours = Number(prefixedHours[1]);
    return hours > 0 ? hours : null;
  }

  return null;
}

function parseCount(token: string): number | null {
  if (/^\d+$/.test(token)) {
    return Number(token);
  }

  return SPANISH_NUMBERS[token] ?? null;
}

export function buildDailyReminderHours(timesPerDay: number, now: Date): number[] {
  const count = Math.max(1, Math.min(MAX_DAILY_REMINDERS, Math.round(timesPerDay)));
  const startHour = (now.getHours() + 1) % 24;
  const intervalHours = 24 / count;

  const hours: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const hour = Math.round((startHour + i * intervalHours) % 24);
    if (!hours.includes(hour)) {
      hours.push(hour);
    }
  }

  return hours.sort((a, b) => a - b);
}

export const MAX_DAILY_REMINDER_COUNT = MAX_DAILY_REMINDERS;