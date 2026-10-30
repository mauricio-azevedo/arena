import { z } from 'zod';

// Leaf: `matches`, `members` and `ranking` all embed a member, and a module
// importing another module for one shape invites a cycle.

// Mirrors MEMBER_USER_SELECT in the API: the four User fields behind
// resolveMemberDisplayName / resolveMemberAvatarColor. No id (the member's
// `userId` is the link) and no email.
const memberUserSchema = z.strictObject({
  firstName: z.string(),
  lastName: z.string(),
  // Shown instead of first+last when set.
  nickname: z.string().nullable(),
  // Palette key; the web owns key→gradient.
  avatarColor: z.string(),
});

// How a member is named and colored, the same on every route that embeds one.
export const memberIdentitySchema = z.strictObject({
  id: z.uuid(),
  // Null for stub players (jogadores sem conta); displayName carries their name.
  userId: z.uuid().nullable(),
  displayName: z.string().nullable(),
  user: memberUserSchema.nullable(),
});

// A stub player's name as typed by whoever adds them: `POST …/members/guest` and
// inline in a match body. Trimmed here, so services store the canonical form.
export const guestNameSchema = z.string().trim().min(1).max(60);
