import { LoginCredentials, LoginErrors, RegisterInput, RegisterErrors } from '@/types/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 6;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.trim().length >= PASSWORD_MIN_LENGTH;
}

export function isValidName(name: string): boolean {
  return name.trim().length > 0;
}

export function validateLoginForm({ email, password }: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {};

  if (!isValidEmail(email)) {
    errors.email = 'Ingresá un email válido.';
  }

  if (!isValidPassword(password)) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }

  return errors;
}

export function validateRegisterForm({
  name,
  email,
  password,
  confirmPassword,
}: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!isValidName(name)) {
    errors.name = 'Ingresá tu nombre.';
  }

  if (!isValidEmail(email)) {
    errors.email = 'Ingresá un email válido.';
  }

  if (!isValidPassword(password)) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}
