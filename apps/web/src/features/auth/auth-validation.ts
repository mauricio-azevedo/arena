// Shared validation for the login/signup drawer views, mirroring the account
// fields in `@arena/contracts/auth` — the schemas themselves stay out of the web
// bundle (zod is not shipped per route). The design's "8" password copy is wrong.
export const AUTH_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_NICKNAME_LENGTH = 24;

export const LOGIN_ERROR = 'Não foi possível entrar. Verifique seu e-mail e senha.';
