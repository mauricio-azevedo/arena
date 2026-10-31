import { z } from 'zod';
import { AVATAR_COLOR_KEYS } from './avatar-color';
import { feedItemTypeSchema } from './feed-item-type';
import { groupMemberRoleSchema } from './group-member-role';
import { isoDateTime } from './iso-datetime';
import { rankingMovementSchema } from './ranking';

// `POST /groups`: the creator becomes the group's first member, an ADMIN.
export const groupBodySchema = z.strictObject({
  name: z.string().trim().min(1),
  // An empty description is stored as null.
  description: z.string().trim().optional(),
  // Omitted: the API picks a varied default seeded by the name, so groups
  // aren't all blue.
  avatarColor: z.string().trim().pipe(z.enum(AVATAR_COLOR_KEYS)).optional(),
});

export type GroupBody = z.infer<typeof groupBodySchema>;

// ---------------------------------------------------------------------------
// Responses. `z.output` is what the API returns (`Date`), `z.input` is the wire
// shape the web receives (ISO strings). Strict objects: an unpromised field is a
// contract break, caught by the e2e parse.
// ---------------------------------------------------------------------------

// A group as every route that answers one sends it: `POST /groups`,
// `GET /groups`, `GET /groups/:groupId`, and embedded in a membership. Every
// `Group` column is public and promised here, so services return the row — a
// column added to the model fails the e2e parse until it is promised or
// selected away. `GroupVisibility` has one value today; it is an enum so a
// second one fails `tsc` in both apps.
export const groupSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  visibility: z.enum(['PUBLIC']),
  // Palette key; the web owns key→gradient.
  avatarColor: z.string(),
  createdById: z.uuid(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

// `GET /me/groups` and `GET /users/:userId/groups`: the caller's active
// memberships with their groups. A membership projection — role and rating, not
// the full competitive state `GET /groups/:groupId/members` answers.
export const groupMembershipResponseSchema = z.strictObject({
  id: z.uuid(),
  groupId: z.uuid(),
  role: groupMemberRoleSchema,
  rating: z.number(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  group: groupSchema,
});

// The group's rank-1 members, denormalized into `GroupHomeSummary` by the
// projection, so a home card costs no per-group ranking query. A tie shares the
// top rank, hence a list.
export const groupHomeLeaderSchema = z.strictObject({
  groupMemberId: z.uuid(),
  // Null for stub players (jogadores sem conta).
  userId: z.uuid().nullable(),
  displayName: z.string(),
  rating: z.number(),
  // Not nullable: a leader is a rank-1 member by construction.
  rank: z.int(),
});

// The viewer's own standing in the group: a rank once the ranking projection
// has one for them, otherwise the rating alone. The movement is the same shape
// the ranking carries, so the arrow is rendered identically in both places.
const groupHomeStandingSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('RANKED'),
    // Not nullable: UNRANKED is the variant for a viewer without a rank yet.
    rank: z.int(),
    rating: z.number(),
    rankingMovement: rankingMovementSchema.nullable(),
  }),
  z.strictObject({
    kind: z.literal('UNRANKED'),
    rating: z.number(),
  }),
]);

// The group's last feed item worth surfacing on the card — joins and the group
// creation are excluded, and a non-member only ever sees a PUBLIC one.
// `metadata` is the item's render payload, frozen at write time and shaped per
// type; the card's copy comes from the feed module, not from here.
const groupHomeActivitySchema = z.strictObject({
  id: z.uuid(),
  type: feedItemTypeSchema,
  occurredAt: isoDateTime,
  importanceScore: z.number(),
  metadata: z.unknown(),
});

// `GET /groups/home` (the viewer's groups, public suggestions when they have
// none) and `GET /groups/home/all` (every public group) item. Counts come from
// the home summary and the match table, so `matchesCount` excludes soft-deleted
// matches; `createdById` is not part of the card.
export const groupHomeCardResponseSchema = z.strictObject({
  relationship: z.enum(['MEMBER', 'PUBLIC_SUGGESTION']),
  // Why the card sits where it does, which is also what the card may explain to
  // the viewer (a rebuild in flight, a failure).
  sortReason: z.enum([
    'FAILED',
    'PROCESSING',
    'RECENT_RELEVANT_ACTIVITY',
    'DEFAULT',
    'PUBLIC_SUGGESTION',
  ]),
  group: groupSchema.omit({ createdById: true }).extend({
    membersCount: z.int(),
    matchesCount: z.int(),
    lastMatchAt: isoDateTime.nullable(),
  }),
  // Null for a group the viewer is not in, and for a signed-out viewer.
  currentUser: z
    .strictObject({
      membershipId: z.uuid(),
      role: groupMemberRoleSchema,
      standing: groupHomeStandingSchema,
    })
    .nullable(),
  leaders: z.array(groupHomeLeaderSchema),
  activity: z.strictObject({
    lastRelevant: groupHomeActivitySchema.nullable(),
    lastRelevantAt: isoDateTime.nullable(),
  }),
  // Ratings and ranks are eventually consistent: this is how far behind the
  // group's projection is. Only the viewer's own groups carry it; `status` is
  // null until the group's first rebuild.
  projection: z
    .strictObject({
      status: z.enum(['CURRENT', 'PROCESSING', 'FAILED']).nullable(),
      lastProcessedAt: isoDateTime.nullable(),
      lastError: z.string().nullable(),
    })
    .nullable(),
});

// The feed item type is a leaf (the feed module reads it too); this is its
// public subpath until that module converts.
export { feedItemTypeSchema, type FeedItemType } from './feed-item-type';

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type GroupResponse = z.output<typeof groupSchema>;
export type Group = z.input<typeof groupSchema>;
export type GroupMembershipResponse = z.output<typeof groupMembershipResponseSchema>;
export type GroupMembership = z.input<typeof groupMembershipResponseSchema>;
export type GroupHomeCardResponse = z.output<typeof groupHomeCardResponseSchema>;
export type GroupHomeCard = z.input<typeof groupHomeCardResponseSchema>;
// Dates stay out of a leader row, so one name serves both apps.
export type GroupHomeLeader = z.infer<typeof groupHomeLeaderSchema>;
