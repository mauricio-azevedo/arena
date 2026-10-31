import { z } from 'zod';
import { groupMemberRoleSchema } from './group-member-role';
import { isoDateTime } from './iso-datetime';
import { matchTeamSchema } from './matches';
import { memberIdentitySchema } from './member-identity';

// Attaching an account to a stub player (jogador sem conta), the shapes the two
// invite controllers answer. Its own file, not `invites.ts`: an invite is the link,
// a claim is what its opener does with it, and `invites.ts` reuses these.

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

// The stub's recognizable history, so whoever opens a claim link can tell it is
// them before taking it over: `GET /invites/:token` (a closed invite's target) and
// `GET /invites/:token/guests/:guestId/summary`. Public — the token is the auth —
// so it carries a name and a record, never an account.
export const claimStubSummarySchema = z.strictObject({
  groupMemberId: z.uuid(),
  displayName: z.string(),
  // Nullable: null until the ranking projection has a rank for the stub.
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
// they already had with the stub's history merged in. Identity, role and rating;
// the group is the one the caller already holds.
export const claimMembershipSchema = memberIdentitySchema.extend({
  groupId: z.uuid(),
  rating: z.number(),
  role: groupMemberRoleSchema,
});

// `POST /invites/:token/claim/:guestId`. BLOCKED is a real outcome, not an error:
// the two played the same match, so they cannot be one person, and the screen
// shows the proof.
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

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type ClaimStubSummaryResponse = z.output<typeof claimStubSummarySchema>;
export type ClaimStubSummary = z.input<typeof claimStubSummarySchema>;
export type SharedMatchResponse = z.output<typeof sharedMatchSchema>;
export type SharedMatch = z.input<typeof sharedMatchSchema>;
export type ClaimAdmin = z.infer<typeof claimAdminSchema>;
// No dates on a membership payload, so one name serves both apps.
export type ClaimMembership = z.infer<typeof claimMembershipSchema>;
export type ClaimResultResponse = z.output<typeof claimResultResponseSchema>;
export type ClaimResult = z.input<typeof claimResultResponseSchema>;
