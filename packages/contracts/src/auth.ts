import { z } from 'zod';
import {
  EMAIL_REGEX,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from './account-field-rules';
import { AVATAR_COLOR_KEYS } from './avatar-color';
import { isoDateTime } from './iso-datetime';

// ---------------------------------------------------------------------------
// The account's own fields. `@arena/contracts/me` edits what register creates,
// so both import these and sign-up and profile edit cannot drift on what a
// name, a nickname or an e-mail is. The numbers and the e-mail pattern live in
// the zod-free `./account-field-rules`, which the web's forms import too — so
// what a field may be is stated once for both apps.
// ---------------------------------------------------------------------------

// "  Ana   Maria " → "Ana Maria": one display name, however it was typed.
const collapseSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

export const accountNameSchema = z.string().overwrite(collapseSpaces).min(1).max(MAX_NAME_LENGTH);

// An empty nickname is stored as null, which clears it back to "First Last" —
// a set nickname is the name the member chose to show others and wins over it.
export const accountNicknameSchema = z
  .string()
  .overwrite(collapseSpaces)
  .max(MAX_NICKNAME_LENGTH)
  .transform((value) => value || null);

export const accountEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(MAX_EMAIL_LENGTH)
  .regex(EMAIL_REGEX);

export const accountAvatarColorSchema = z.string().trim().pipe(z.enum(AVATAR_COLOR_KEYS));

// `POST /auth/register`: creates the account and signs it in. Password length
// is the only credential rule here, and it is uncoded — the web branches on the
// form, not on the answer. Changing a password later is the coded case
// (`@arena/contracts/me`).
export const registerBodySchema = z.strictObject({
  firstName: accountNameSchema,
  lastName: accountNameSchema,
  email: accountEmailSchema,
  password: z.string().min(MIN_PASSWORD_LENGTH),
  nickname: accountNicknameSchema.optional(),
});

// `POST /auth/login`. The e-mail is normalized but not validated past being
// present: an address no account could have must answer the same 401 as a wrong
// password, never a 400 that tells the caller which half was wrong.
export const loginBodySchema = z.strictObject({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// A body whose schema normalizes is two types, like a response: `XBody` is what
// the service receives, `XInput` what the web sends (an empty nickname, which
// the schema turns into null).
export type RegisterBody = z.output<typeof registerBodySchema>;
export type RegisterInput = z.input<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;

// ---------------------------------------------------------------------------
// Responses. `z.output` is what the API returns (`Date`), `z.input` is the wire
// shape the web receives (ISO strings). Strict objects: an unpromised field is a
// contract break, caught by the e2e parse.
// ---------------------------------------------------------------------------

// The signed-in account as it sees itself: `GET /auth/me`, and nested in the
// register, login and profile-update answers. Its own e-mail is always sent
// (the column is NOT NULL) — a profile seen by someone else withholds it
// instead (`@arena/contracts/profiles`). `passwordHash` is not here and must
// never be: every route selects these columns by name.
export const accountSchema = z.strictObject({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  // Set = the name shown to others; null = "First Last".
  nickname: z.string().nullable(),
  email: z.string(),
  // Palette key, always set; the web owns key→gradient.
  avatarColor: z.string(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

// `POST /auth/register`, `POST /auth/login` and `PATCH /me/profile`: the account
// plus the 7-day JWT the web stores. The profile update answers it too because
// the token carries the e-mail, so an edit has to re-sign it.
export const authSessionResponseSchema = z.strictObject({
  user: accountSchema,
  accessToken: z.string(),
});

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type AccountResponse = z.output<typeof accountSchema>;
export type Account = z.input<typeof accountSchema>;
export type AuthSessionResponse = z.output<typeof authSessionResponseSchema>;
export type AuthSession = z.input<typeof authSessionResponseSchema>;
