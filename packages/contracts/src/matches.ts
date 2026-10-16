import { z } from 'zod';

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
