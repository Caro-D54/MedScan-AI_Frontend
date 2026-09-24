import { validateLoginForm, validateRegisterForm } from '../src/utils/validation';

describe('validateLoginForm', () => {
  it('returns no errors for valid credentials', () => {
    expect(validateLoginForm({ email: 'user@example.com', password: '123456' })).toEqual({});
  });

  it('returns an email error for an invalid email', () => {
    const result = validateLoginForm({ email: 'bad-email', password: '123456' });
    expect(result.email).toBeTruthy();
  });

  it('returns a password error for a too-short password', () => {
    const result = validateLoginForm({ email: 'user@example.com', password: '123' });
    expect(result.password).toBeTruthy();
  });

  it('returns both errors when both fields are invalid', () => {
    const result = validateLoginForm({ email: 'bad-email', password: '' });
    expect(result.email).toBeTruthy();
    expect(result.password).toBeTruthy();
  });
});

describe('validateRegisterForm', () => {
  it('returns no errors for a valid registration input', () => {
    const input = { name: 'María', email: 'user@example.com', password: '123456', confirmPassword: '123456' };
    expect(validateRegisterForm(input)).toEqual({});
  });

  it('returns an error when the name is empty', () => {
    const input = { name: '', email: 'user@example.com', password: '123456', confirmPassword: '123456' };
    expect(validateRegisterForm(input).name).toBeTruthy();
  });

  it('returns an error when the email is invalid', () => {
    const input = { name: 'María', email: 'bad-email', password: '123456', confirmPassword: '123456' };
    expect(validateRegisterForm(input).email).toBeTruthy();
  });

  it('returns an error when the password is too short', () => {
    const input = { name: 'María', email: 'user@example.com', password: '123', confirmPassword: '123' };
    expect(validateRegisterForm(input).password).toBeTruthy();
  });

  it('returns an error when passwords do not match', () => {
    const input = { name: 'María', email: 'user@example.com', password: '123456', confirmPassword: '654321' };
    expect(validateRegisterForm(input).confirmPassword).toBeTruthy();
  });
});
