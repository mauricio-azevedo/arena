import { z } from 'zod';
import { isoDateTime } from './iso-datetime';

// A match player is either an existing group member or a brand-new guest named
// inline; the API creates the guest's stub inside the match transaction, so it
// only exists once the match does. Strict objects make the two shapes exclusive.
const matchPlayerInputSchema = z.union([
  z.strictObject({ memberId: z.uuid() }),
  z.strictObject({ name: z.string().trim().min(1).max(60) }),
]);

export const matchBodySchema = z
  .strictObject({
    teamAPlayer1: matchPlayerInputSchema,
    teamAPlayer2: matchPlayerInputSchema,
    teamBPlayer1: matchPlayerInputSchema,
    teamBPlayer2: matchPlayerInputSchema,
    gamesA: z.int().nonnegative(),
    gamesB: z.int().nonnegative(),
    // Omitted: the API stamps "now".
    playedAt: z.iso.datetime({ offset: true }).optional(),
  })
  // No draws, which also rules out 0-0.
  .refine((body) => body.gamesA !== body.gamesB, {
    error: 'A match cannot end in a draw',
    path: ['gamesB'],
  });

export type MatchBody = z.infer<typeof matchBodySchema>;
export type MatchPlayerInput = z.infer<typeof matchPlayerInputSchema>;

// ---------------------------------------------------------------------------
// Responses. `z.output` is what the API returns (`Date`), `z.input` is the wire
// shape the web receives (ISO strings). Strict objects: an unpromised field is a
// contract break, caught by the e2e parse. The contract lists what the API
// sends minus processing internals, not only what the web reads today.
// ---------------------------------------------------------------------------

export const matchTeamSchema = z.enum(['TEAM_A', 'TEAM_B']);

export const matchProcessingStatusSchema = z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED']);

const rankingMovementDirectionSchema = z.enum(['UP', 'DOWN']);

// Identity only. Ratings in a match response are the MatchPlayer snapshot; the
// member's current rating, role or leftAt would be misleading next to it.
const matchPlayerMemberSchema = z.strictObject({
  id: z.uuid(),
  // Null for stub players (jogadores sem conta); displayName carries their name.
  userId: z.uuid().nullable(),
  displayName: z.string().nullable(),
  user: z
    .strictObject({
      firstName: z.string(),
      lastName: z.string(),
      nickname: z.string().nullable(),
      avatarColor: z.string(),
    })
    .nullable(),
});

const matchPlayerSchema = z.strictObject({
  id: z.uuid(),
  matchId: z.uuid(),
  groupId: z.uuid(),
  groupMemberId: z.uuid(),
  team: matchTeamSchema,
  position: z.int(),

  ratingBefore: z.number(),
  ratingAfter: z.number(),
  ratingDelta: z.number(),

  rankBefore: z.int().nullable(),
  rankAfter: z.int().nullable(),
  rankDelta: z.int().nullable(),
  movementDirection: rankingMovementDirectionSchema.nullable(),
  movementPositions: z.int().nullable(),

  ratingDeviationBefore: z.number().nullable(),
  ratingDeviationAfter: z.number().nullable(),
  ratingVolatilityBefore: z.number().nullable(),
  ratingVolatilityAfter: z.number().nullable(),
  ratingMuBefore: z.number().nullable(),
  ratingMuAfter: z.number().nullable(),
  ratingSigmaBefore: z.number().nullable(),
  ratingSigmaAfter: z.number().nullable(),

  playedAt: isoDateTime,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  groupMember: matchPlayerMemberSchema,
});

export const matchResponseSchema = z.strictObject({
  id: z.uuid(),
  groupId: z.uuid(),
  gamesA: z.int(),
  gamesB: z.int(),
  winnerTeam: matchTeamSchema.nullable(),

  teamAExpected: z.number().nullable(),
  teamBExpected: z.number().nullable(),
  teamAActual: z.number().nullable(),
  teamBActual: z.number().nullable(),
  teamARatingBefore: z.number().nullable(),
  teamBRatingBefore: z.number().nullable(),
  teamARatingAfter: z.number().nullable(),
  teamBRatingAfter: z.number().nullable(),
  ratingAlgorithm: z.string(),

  // Ratings are computed by a queued job; reads must tolerate anything but
  // PROCESSED. The failure detail and timestamps stay server-side.
  processingStatus: matchProcessingStatusSchema,

  playedAt: isoDateTime,
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  // Ordered by team, then position.
  players: z.array(matchPlayerSchema),
});

export const matchDeletedResponseSchema = z.strictObject({
  success: z.boolean(),
});

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type MatchResponse = z.output<typeof matchResponseSchema>;
export type Match = z.input<typeof matchResponseSchema>;
export type MatchPlayer = Match['players'][number];
export type MatchTeam = z.infer<typeof matchTeamSchema>;
export type MatchProcessingStatus = z.infer<typeof matchProcessingStatusSchema>;
export type MatchDeletedResponse = z.infer<typeof matchDeletedResponseSchema>;
