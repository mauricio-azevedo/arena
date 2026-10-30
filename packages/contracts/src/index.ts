// The root is the zod-free surface: values both apps need at runtime, with no
// schema behind them, so importing from here never pulls zod into the web
// bundle (code-organization §3.3). Schemas live on the per-module subpaths.
export {
  EMAIL_REGEX,
  MAX_NICKNAME_LENGTH,
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
} from './account-field-rules';
export { API_ERROR_CODES, type ApiErrorCode } from './api-errors';
export { AVATAR_COLOR_KEYS, isAvatarColorKey, type AvatarColorKey } from './avatar-color';
