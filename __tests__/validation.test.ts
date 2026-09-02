import { isValidEmail, isValidPassword, isValidName } from '../src/utils/validation';

describe('validation', () => {
  describe('isValidEmail', () => {
    it('returns true for a valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('returns false for an email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('returns true for a password with the minimum length', () => {
      expect(isValidPassword('123456')).toBe(true);
    });

    it('returns true for a long password', () => {
      expect(isValidPassword('secret-and-long-password')).toBe(true);
    });

    it('returns false for a password shorter than the minimum', () => {
      expect(isValidPassword('12345')).toBe(false);
    });

    it('returns false for an empty password', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('returns false for a password with only spaces', () => {
      expect(isValidPassword('      ')).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('returns true for a non-empty name', () => {
      expect(isValidName('María')).toBe(true);
    });

    it('returns false for an empty name', () => {
      expect(isValidName('')).toBe(false);
    });

    it('returns false for a name with only spaces', () => {
      expect(isValidName('   ')).toBe(false);
    });
  });
});
