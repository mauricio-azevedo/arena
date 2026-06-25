// Shared validation for the login/signup drawer views. Password length mirrors the
// backend rule (`auth.service.ts`, ≥6); the design's "8" copy is wrong.
export const AUTH_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NICKNAME_LENGTH = 24;

export const LOGIN_ERROR = 'Não foi possível entrar. Verifique seu e-mail e senha.';

export function friendlySignupError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('email') && message.includes('use')) {
    return 'Esse email já está em uso.';
  }
  return 'Não foi possível criar sua conta. Verifique os dados e tente de novo.';
}
