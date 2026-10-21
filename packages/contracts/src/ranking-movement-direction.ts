import { z } from 'zod';

// Which way a rank moved. Leaf, imported by module files (`matches` for the
// MatchPlayer snapshot, `ranking` for the live movement).
export const rankingMovementDirectionSchema = z.enum(['UP', 'DOWN']);

export type RankingMovementDirection = z.infer<typeof rankingMovementDirectionSchema>;
