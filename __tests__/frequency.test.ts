import { parseFrequencyToHours, buildDailyReminderHours } from '../src/utils/frequency';

describe('parseFrequencyToHours', () => {
  it.each([
    ['cada 8 horas', 8],
    ['Cada 8 h', 8],
    ['cada 12hs', 12],
    ['cada 6-8 horas', null],
    ['8 horas', 8],
    ['cada 8', 8],
    ['una vez al día', 24],
    ['1 vez al día', 24],
    ['2 veces al día', 12],
    ['3 veces por día', 8],
    ['cada día', 24],
    ['diaria', 24],
    ['cada 30 minutos', 0.5],
    ['cada hora', 1],
  ])('parses "%s" to %s hours', (frequency, expected) => {
    expect(parseFrequencyToHours(frequency)).toBe(expected);
  });

  it.each([[''], ['   '], ['sin frecuencia'], ['lo que sea']])(
    'returns null for unparseable "%s"',
    (frequency) => {
      expect(parseFrequencyToHours(frequency)).toBeNull();
    },
  );
});

describe('buildDailyReminderHours', () => {
  it('spreads times evenly starting from the next full hour', () => {
    const now = new Date(2026, 0, 1, 10, 30);
    expect(buildDailyReminderHours(3, now)).toEqual([3, 11, 19]);
  });

  it('returns a single hour for once a day', () => {
    const now = new Date(2026, 0, 1, 10, 30);
    expect(buildDailyReminderHours(1, now)).toEqual([11]);
  });

  it('wraps around midnight', () => {
    const now = new Date(2026, 0, 1, 23, 15);
    expect(buildDailyReminderHours(3, now)).toEqual([0, 8, 16]);
  });

  it('caps the number of daily reminders', () => {
    const now = new Date(2026, 0, 1, 8, 0);
    expect(buildDailyReminderHours(24, now)).toHaveLength(6);
  });
});