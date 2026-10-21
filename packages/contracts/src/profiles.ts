import { z } from 'zod';
import { groupMemberRoleSchema } from './group-member-role';
import { isoDateTime } from './iso-datetime';
import { matchTeamSchema } from './matches';

// ---------------------------------------------------------------------------
// Profile responses. Two modules answer the same shapes: `GET /me/profile/*`
// (own profile) and `GET /users/:userId/profile/*` (anyone's). Read models the
// profile services assemble, never a Prisma row. `z.output` is what the API
// returns (`Date`), `z.input` is the wire shape the web receives (ISO strings).
// Strict objects: an unpromised field is a contract break, caught by the e2e
// parse.
// ---------------------------------------------------------------------------

const profileMatchResultSchema = z.enum(['WIN', 'LOSS']);

const profileSummaryStatsSchema = z.strictObject({
  matchesPlayed: z.int(),
  wins: z.int(),
  losses: z.int(),
  // 0–100, rounded.
  winRate: z.int(),
  // Results of the most recent matches, most recent first ("forma recente").
  recentForm: z.array(profileMatchResultSchema),
});

const profileSummaryPartnerSchema = z.strictObject({
  // Null for stub partners (jogadores sem conta): no linkable profile, never
  // merged across groups.
  userId: z.uuid().nullable(),
  displayName: z.string(),
  // Palette key; null for stubs.
  avatarColor: z.string().nullable(),
  // Rank in the group the two have played the most together; null while
  // unranked. A hint once a partner is merged across groups, not a per-group
  // figure.
  currentRank: z.int().nullable(),
  matchesTogether: z.int(),
  winsTogether: z.int(),
  lossesTogether: z.int(),
  // 0–100, rounded.
  winRate: z.int(),
});

const profileMatchPlayerSchema = z.strictObject({
  // Null for stub players (jogadores sem conta): no linkable profile.
  userId: z.uuid().nullable(),
  displayName: z.string(),
});

// One of the player's matches, from their side (`result`).
const profileSummaryMatchSchema = z.strictObject({
  id: z.uuid(),
  groupId: z.uuid(),
  groupName: z.string(),
  playedAt: isoDateTime,
  gamesA: z.int(),
  gamesB: z.int(),
  winnerTeam: matchTeamSchema.nullable(),
  result: profileMatchResultSchema,
  // Each ordered by position.
  teamA: z.array(profileMatchPlayerSchema),
  teamB: z.array(profileMatchPlayerSchema),
});

// `GET …/profile/matches` item: the summary match plus the player's own rating
// snapshot for it.
export const profileMatchListItemSchema = profileSummaryMatchSchema.extend({
  ratingBefore: z.number(),
  ratingAfter: z.number(),
  ratingDelta: z.number(),
});

const profileSummaryGroupSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  // Group.avatarColor palette key; the web owns key→gradient.
  avatarColor: z.string(),
  rating: z.number(),
  role: groupMemberRoleSchema,
  lastPlayedAt: isoDateTime.nullable(),
  // Rank in this group ("#13"); null while unranked.
  currentRank: z.int().nullable(),
  // Active members ("de 19").
  membersCount: z.int(),
  // Rank change from the latest match (positive = climbed); null until that
  // match is processed.
  rankDelta: z.int().nullable(),
});

const profileSummaryUserSchema = z.strictObject({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  // Shown to others when set; drives the profile handle line.
  nickname: z.string().nullable(),
  // Own profile only: set on `GET /me/profile/summary`, null on
  // `GET /users/:userId/profile/summary`. One schema for both routes because one
  // screen renders both and this is their only difference; null means withheld,
  // never "no email" (the column is NOT NULL).
  email: z.string().nullable(),
  // Avatar palette key, always set.
  avatarColor: z.string(),
  // Account creation, the "desde …" line.
  memberSince: isoDateTime,
});

export const profileSummaryResponseSchema = z.strictObject({
  user: profileSummaryUserSchema,
  stats: profileSummaryStatsSchema,
  // Most successful partnership ("melhor dupla"); null without a partner.
  bestPartner: profileSummaryPartnerSchema.nullable(),
  // Every partnership, strongest first ("suas duplas").
  partners: z.array(profileSummaryPartnerSchema),
  partnerCount: z.int(),
  // Most recent first.
  recentMatches: z.array(profileSummaryMatchSchema),
  // Most recently played first; never played last.
  recentGroups: z.array(profileSummaryGroupSchema),
});

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type ProfileSummaryResponse = z.output<typeof profileSummaryResponseSchema>;
export type ProfileSummary = z.input<typeof profileSummaryResponseSchema>;
export type ProfileUser = ProfileSummary['user'];
export type ProfileSummaryStats = z.infer<typeof profileSummaryStatsSchema>;
export type ProfileSummaryPartner = z.infer<typeof profileSummaryPartnerSchema>;
export type ProfileSummaryMatchResponse = z.output<typeof profileSummaryMatchSchema>;
export type ProfileSummaryGroupResponse = z.output<typeof profileSummaryGroupSchema>;
export type ProfileSummaryGroup = z.input<typeof profileSummaryGroupSchema>;
export type ProfileMatchListItemResponse = z.output<typeof profileMatchListItemSchema>;
export type ProfileMatchListItem = z.input<typeof profileMatchListItemSchema>;
export type ProfileMatchResult = z.infer<typeof profileMatchResultSchema>;
