import { formatMedicationName, isValidEmail, calculateDaysBetween } from '../src/utils';

describe('Utils', () => {
  describe('formatMedicationName', () => {
    it('capitalizes first letter and lowercases the rest', () => {
      expect(formatMedicationName('ibuprofen')).toBe('Ibuprofen');
    });

    it('handles already capitalized names', () => {
      expect(formatMedicationName('Paracetamol')).toBe('Paracetamol');
    });

    it('handles empty string', () => {
      expect(formatMedicationName('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('returns false for invalid email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('returns false for invalid email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('calculateDaysBetween', () => {
    it('calculates days between two dates', () => {
      expect(calculateDaysBetween('2026-01-01', '2026-01-10')).toBe(9);
    });

    it('returns 0 for same date', () => {
      expect(calculateDaysBetween('2026-01-01', '2026-01-01')).toBe(0);
    });

    it('handles reversed dates', () => {
      expect(calculateDaysBetween('2026-01-10', '2026-01-01')).toBe(9);
    });
  });
});
