// Machine-readable codes for the business errors the web app must distinguish. The API
// stamps one on the error body (`code`); the UI branches on it instead of parsing message
// copy. Append-only. Add a code only when a screen needs to react to that specific
// failure — plain string exceptions stay the default everywhere else.
export const API_ERROR_CODES = {
  GUEST_ALREADY_CLAIMED: 'GUEST_ALREADY_CLAIMED',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
  PASSWORD_SAME_AS_CURRENT: 'PASSWORD_SAME_AS_CURRENT',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
