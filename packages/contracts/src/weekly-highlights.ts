import { z } from 'zod';

// Response-only, one route: `GET /home/weekly-highlights` (module
// `home-highlights`).

// What a week can be recognized for (spec: `docs/product/weekly-highlights.md`).
export const highlightTypeSchema = z.enum([
  'WIN_STREAK_CURRENT',
  'WIN_STREAK_RECORD',
  'CLIMB',
  'LEADERSHIP',
  'MILESTONE_MATCHES',
  'MILESTONE_WINS',
]);

// Where the card came from: someone in a group the viewer plays in, or the rest
// of Arena (a higher bar, viewer-independent).
export const highlightOriginSchema = z.enum(['GROUP', 'ARENA']);

// One card of the home rail. Identity arrives resolved — the rail renders a name
// and a palette key, never the `User` behind them.
export const weeklyHighlightCardSchema = z.strictObject({
  userId: z.uuid(),
  displayName: z.string(),
  // Palette key, null when the person never picked one; the web falls back to a
  // deterministic fill.
  avatarColor: z.string().nullable(),
  groupMemberId: z.uuid(),
  group: z.strictObject({ id: z.uuid(), name: z.string() }),
  achievement: z.strictObject({
    type: highlightTypeSchema,
    value: z.int(),
  }),
  origin: highlightOriginSchema,
});

// No timestamp on the card — the 7-day window is applied server-side — so one
// name serves both apps.
export type HighlightType = z.infer<typeof highlightTypeSchema>;
export type HighlightOrigin = z.infer<typeof highlightOriginSchema>;
export type WeeklyHighlightCard = z.infer<typeof weeklyHighlightCardSchema>;
