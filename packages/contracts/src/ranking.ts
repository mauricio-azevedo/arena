import { z } from 'zod';
import { isoDateTime } from './iso-datetime';
import { groupMemberResponseSchema } from './members';
import { rankingMovementDirectionSchema } from './ranking-movement-direction';

// A member's visible rank change from their latest processed match: `direction`
// and `positions` drive the arrow next to a name, the before/after pairs the
// detail. The same shape sits on the group home standing (`groups`), so no
// member id inside: the owner is whatever it hangs on.
//
// The only payload that spells a rank `currentRank`: here the prefix pairs with
// `previousRank` the way `currentRating` pairs with `previousRating`. A member's
// rank on its own is `rank` everywhere (`members`, `profiles`, `groups`,
// `claims`). Neither rank is nullable — a movement exists only between two
// known positions.
export const rankingMovementSchema = z.strictObject({
  direction: rankingMovementDirectionSchema,
  positions: z.int(),
  previousRank: z.int(),
  currentRank: z.int(),
  previousRating: z.number(),
  currentRating: z.number(),
  sourceMatchId: z.uuid(),
  occurredAt: isoDateTime,
});

// `GET /groups/:groupId/ranking` item: an active member in display order
// (rating desc, then name — the index is the rank shown) with the projected
// stats, zero before the first processed match, and the movement, if any.
export const rankingEntrySchema = groupMemberResponseSchema.extend({
  stats: z.strictObject({
    matchesCount: z.int(),
    winsCount: z.int(),
  }),
  rankingMovement: rankingMovementSchema.nullable(),
});

export type RankingMovementResponse = z.output<typeof rankingMovementSchema>;
export type RankingMovement = z.input<typeof rankingMovementSchema>;
export type RankingEntryResponse = z.output<typeof rankingEntrySchema>;
export type RankingEntry = z.input<typeof rankingEntrySchema>;
