import { z } from 'zod';
import { groupMemberRoleSchema } from './group-member-role';
import { isoDateTime } from './iso-datetime';
import { guestNameSchema, memberIdentitySchema } from './member-identity';
import { profileMatchListItemSchema, profileSummaryStatsSchema } from './profiles';

// `POST /groups/:groupId/members`: an admin adds an existing account. Someone
// who left rejoins on the same membership, history kept.
export const memberBodySchema = z.strictObject({
  userId: z.uuid(),
});

// `POST /groups/:groupId/members/guest`: any active member adds a stub player.
export const guestMemberBodySchema = z.strictObject({
  name: guestNameSchema,
});

export type MemberBody = z.infer<typeof memberBodySchema>;
export type GuestMemberBody = z.infer<typeof guestMemberBodySchema>;

// ---------------------------------------------------------------------------
// Responses. `z.output` is what the API returns (`Date`), `z.input` is the wire
// shape the web receives (ISO strings). Strict objects: an unpromised field is a
// contract break, caught by the e2e parse.
// ---------------------------------------------------------------------------

// One membership, as `GET …/members` lists them (active only, by rating) and as
// the writes answer: `POST …/members`, `POST …/members/guest`,
// `POST …/members/:memberId/unlink` and `DELETE …/members/:memberId` — there
// with `leftAt` set, a removal is a soft leave and the history stays on the
// membership. Competitive state lives here, never on the user: one of these per
// group per person.
export const groupMemberResponseSchema = memberIdentitySchema.extend({
  groupId: z.uuid(),
  rating: z.number(),
  ratingDeviation: z.number().nullable(),
  ratingVolatility: z.number().nullable(),
  ratingMu: z.number().nullable(),
  ratingSigma: z.number().nullable(),
  ratingAlgorithm: z.string(),
  // `rank` is the one name a member's rank goes out under, on every payload that
  // carries one — the column behind it is `currentRank`, and the
  // `previousRank`/`currentRank` pair exists only inside a ranking movement,
  // where the prefix earns itself. Null until the first processed match (a
  // member can be in the group and unranked), and it can lag: the order of
  // `GET …/ranking` is the rank shown.
  rank: z.int().nullable(),
  role: groupMemberRoleSchema,
  leftAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

// `GET …/members/:memberId/profile`: one membership's standing and matches
// inside its group — the only profile a stub player can have. Stats and match
// shapes are the ones `/me/profile/*` answers.
export const memberProfileResponseSchema = z.strictObject({
  groupMemberId: z.uuid(),
  groupId: z.uuid(),
  userId: z.uuid().nullable(),
  displayName: z.string(),
  // Palette key of the linked user; null for stubs.
  avatarColor: z.string().nullable(),
  rating: z.number(),
  // Nullable: a stub player's profile exists before they are ranked.
  rank: z.int().nullable(),
  stats: profileSummaryStatsSchema,
  // Most recent first.
  matches: z.array(profileMatchListItemSchema),
});

// The role enum is a leaf (`profiles` reads it too); this is its public subpath.
export { groupMemberRoleSchema, type GroupMemberRole } from './group-member-role';

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type GroupMemberResponse = z.output<typeof groupMemberResponseSchema>;
export type GroupMember = z.input<typeof groupMemberResponseSchema>;
export type MemberProfileResponse = z.output<typeof memberProfileResponseSchema>;
export type MemberProfile = z.input<typeof memberProfileResponseSchema>;
