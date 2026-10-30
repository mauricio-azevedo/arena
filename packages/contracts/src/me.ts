import { z } from 'zod';
import {
  accountAvatarColorSchema,
  accountEmailSchema,
  accountNameSchema,
  accountNicknameSchema,
} from './auth';

// `PATCH /me/profile`: a partial edit of the signed-in account — every field
// optional, at least one required. The fields are the account's own (`./auth`),
// so an edit accepts exactly what sign-up did. Uniqueness is not shape: a taken
// e-mail answers a coded 409 (`EMAIL_IN_USE`) from the service.
export const updateProfileBodySchema = z
  .strictObject({
    firstName: accountNameSchema.optional(),
    lastName: accountNameSchema.optional(),
    // Empty clears the nickname back to "First Last".
    nickname: accountNicknameSchema.optional(),
    email: accountEmailSchema.optional(),
    avatarColor: accountAvatarColorSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one profile field is required',
  });

// `PATCH /me/password`. Shape only, on purpose: the new password's length and
// byte limits stay in `me-password.service.ts`, which answers them with the
// codes the UI branches on (`PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, and
// `PASSWORD_SAME_AS_CURRENT` / `INVALID_CURRENT_PASSWORD` for the rules). A
// schema failure carries no code, so it would reach the user as the generic
// copy.
export const updatePasswordBodySchema = z.strictObject({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

// `XBody` is what the service receives, `XInput` what the web sends — the two
// differ wherever the schema normalizes (an emptied nickname becomes null).
export type UpdateProfileBody = z.output<typeof updateProfileBodySchema>;
export type UpdateProfileInput = z.input<typeof updateProfileBodySchema>;
export type UpdatePasswordBody = z.infer<typeof updatePasswordBodySchema>;

// `PATCH /me/password` acknowledges and nothing more: the JWT carries the id and
// e-mail, so a new password leaves the session valid and there is no token to
// hand back.
export const passwordUpdatedResponseSchema = z.strictObject({
  success: z.literal(true),
});

export type PasswordUpdatedResponse = z.infer<typeof passwordUpdatedResponseSchema>;

// `PATCH /me/profile` answers the session register and login answer: the edit
// re-signs the token, which carries the e-mail.
export { authSessionResponseSchema, type AuthSession, type AuthSessionResponse } from './auth';
