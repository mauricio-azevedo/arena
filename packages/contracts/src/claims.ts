import { z } from 'zod';
import { accountEmailSchema } from './auth';
import { groupMemberRoleSchema } from './group-member-role';
import { isoDateTime } from './iso-datetime';
import { matchTeamSchema } from './matches';
import { memberIdentitySchema } from './member-identity';

// Attaching an account to a stub player (jogador sem conta). Two flows reach the
// same shapes: the invite link (`@arena/contracts/invites`) and the legacy
// email-anchored offer an admin creates, so they live here.

// `POST /groups/:groupId/members/:memberId/claim-email`: the e-mail is the auth
// nonce for the confirm, and it only ever matches an account's own address — so
// it is normalized by the same schema register uses, not a second regex.
export const claimEmailBodySchema = z.strictObject({
  email: accountEmailSchema,
});

export type ClaimEmailBody = z.infer<typeof claimEmailBodySchema>;

// ---------------------------------------------------------------------------
// Responses. `z.output` is what the API returns (`Date`), `z.input` is the wire
// shape the web receives (ISO strings). Strict objects: an unpromised field is a
// contract break, caught by the e2e parse.
// ---------------------------------------------------------------------------

// One of the stub's matches, from the stub's own side: who it played with and
// against, and the score that way round.
const claimRecentMatchSchema = z.strictObject({
  id: z.uuid(),
  result: z.enum(['WIN', 'LOSS']),
  partners: z.array(z.string()),
  opponents: z.array(z.string()),
  scoreFor: z.int(),
  scoreAgainst: z.int(),
  playedAt: isoDateTime,
});

// The stub's recognizable history, so whoever opens a claim link or an offer can
// tell it is them before taking it over: `GET /invites/:token` (a closed
// invite's target), `GET /invites/:token/guests/:guestId/summary` and
// `GET /me/claims/:stubId`. Public on the two invite routes — the token is the
// auth — so it carries a name and a record, never an account.
export const claimStubSummarySchema = z.strictObject({
  groupMemberId: z.uuid(),
  displayName: z.string(),
  // Null until the ranking projection has a rank for them.
  rank: z.int().nullable(),
  rating: z.number(),
  matchesCount: z.int(),
  // The three most recent, newest first.
  recentMatches: z.array(claimRecentMatchSchema),
});

// Marks the two people the conflict is about, so the screen can highlight them.
const sharedMatchPlayerSchema = z.strictObject({
  name: z.string(),
  isStub: z.boolean(),
  isYou: z.boolean(),
});

const sharedMatchTeamSchema = z.strictObject({
  team: matchTeamSchema,
  score: z.int(),
  won: z.boolean(),
  players: z.array(sharedMatchPlayerSchema),
});

const sharedMatchSchema = z.strictObject({
  id: z.uuid(),
  playedAt: isoDateTime,
  // Always `[TEAM_A, TEAM_B]`, each with its players in position order.
  teams: z.array(sharedMatchTeamSchema),
});

// Who to talk to when a claim is blocked.
const claimAdminSchema = z.strictObject({
  groupMemberId: z.uuid(),
  name: z.string(),
});

// The membership the claimer ends up with — the stub they took over, or the one
// they already had with the stub's history merged in. Identity, role and rating:
// the claim-email columns are server-side, and the group is the one the caller
// already holds.
export const claimMembershipSchema = memberIdentitySchema.extend({
  groupId: z.uuid(),
  rating: z.number(),
  role: groupMemberRoleSchema,
});

// `POST /invites/:token/claim/:guestId` and `POST /me/claims/:stubId/confirm`.
// BLOCKED is a real outcome, not an error: the two played the same match, so
// they cannot be one person, and the screen shows the proof.
export const claimResultResponseSchema = z.discriminatedUnion('outcome', [
  z.strictObject({
    outcome: z.literal('CLAIMED'),
    membership: claimMembershipSchema,
  }),
  z.strictObject({
    outcome: z.literal('BLOCKED'),
    stubName: z.string(),
    sharedMatches: z.array(sharedMatchSchema),
    admins: z.array(claimAdminSchema),
  }),
]);

// `POST /me/claims/:stubId/decline` acknowledges and nothing more: the admins are
// told, and the person has nothing left to act on.
export const claimDeclinedResponseSchema = z.strictObject({
  outcome: z.literal('DECLINED'),
});

// `POST/DELETE/GET /groups/:groupId/members/:memberId/claim-email`: what the
// admin sees about the e-mail anchored on a stub. Admin-only — the address is
// never part of a member payload.
export const claimEmailStateSchema = z.strictObject({
  email: z.string().nullable(),
  status: z.enum(['PENDING', 'DECLINED']).nullable(),
  notified: z.boolean(),
  // True when an account with that address exists, so the offer is deliverable.
  accountExists: z.boolean(),
});

// `GET /me/claims/:stubId`: the offer its recipient reviews.
export const claimOfferDetailResponseSchema = z.strictObject({
  stubGroupMemberId: z.uuid(),
  groupId: z.uuid(),
  groupName: z.string(),
  stub: claimStubSummarySchema,
});

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type ClaimStubSummaryResponse = z.output<typeof claimStubSummarySchema>;
export type ClaimStubSummary = z.input<typeof claimStubSummarySchema>;
export type ClaimRecentMatch = ClaimStubSummary['recentMatches'][number];
export type SharedMatchResponse = z.output<typeof sharedMatchSchema>;
export type SharedMatch = z.input<typeof sharedMatchSchema>;
export type ClaimAdmin = z.infer<typeof claimAdminSchema>;
// No dates on a membership payload, so one name serves both apps.
export type ClaimMembership = z.infer<typeof claimMembershipSchema>;
export type ClaimResultResponse = z.output<typeof claimResultResponseSchema>;
export type ClaimResult = z.input<typeof claimResultResponseSchema>;
export type ClaimDeclinedResponse = z.infer<typeof claimDeclinedResponseSchema>;
export type ClaimEmailState = z.infer<typeof claimEmailStateSchema>;
export type ClaimOfferDetailResponse = z.output<typeof claimOfferDetailResponseSchema>;
export type ClaimOfferDetail = z.input<typeof claimOfferDetailResponseSchema>;
