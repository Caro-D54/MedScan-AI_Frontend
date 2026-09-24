export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>;

export type RegisterErrors = Partial<Record<keyof RegisterInput, string>>;
