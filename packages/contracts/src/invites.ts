import { z } from 'zod';
import { claimStubSummarySchema } from './claims';
import { groupSchema } from './groups';
import { isoDateTime } from './iso-datetime';
import { memberUserSchema } from './member-identity';

// `POST /groups/:groupId/invites` (admin only). No target = the group's open
// invite, whose opener self-identifies against the roster; a target = a closed
// invite addressed to one guest. A plain request (neither cap nor expiry) reuses
// the group's active invite, so the link stays stable.
export const inviteBodySchema = z.strictObject({
  // Omitted = unlimited.
  maxUses: z.int().positive().optional(),
  // Omitted = never expires. The codec hands the service a `Date`, so an
  // unparseable instant fails here as a 400 instead of reaching the column.
  expiresAt: isoDateTime.optional(),
  targetGroupMemberId: z.uuid().optional(),
});

// `POST /groups/:groupId/invites/:token/accept`. The public route takes the
// caller from the JWT instead.
export const inviteAcceptBodySchema = z.strictObject({
  userId: z.uuid(),
});

// `XBody` is what the service receives (`expiresAt` already a `Date`), `XInput`
// what the web sends.
export type InviteBody = z.output<typeof inviteBodySchema>;
export type InviteInput = z.input<typeof inviteBodySchema>;
export type InviteAcceptBody = z.infer<typeof inviteAcceptBodySchema>;

// ---------------------------------------------------------------------------
// Responses. `z.output` is what the API returns (`Date`), `z.input` is the wire
// shape the web receives (ISO strings). Strict objects: an unpromised field is a
// contract break, caught by the e2e parse.
// ---------------------------------------------------------------------------

// Every `GroupInvite` column: the token is the link itself, so there is nothing
// on this row to withhold.
const inviteSchema = z.strictObject({
  id: z.uuid(),
  token: z.string(),
  groupId: z.uuid(),
  createdById: z.uuid(),
  expiresAt: isoDateTime.nullable(),
  revokedAt: isoDateTime.nullable(),
  uses: z.int(),
  maxUses: z.int().nullable(),
  // Null = open invite (the group link); set = closed invite addressed to that
  // guest.
  targetGroupMemberId: z.uuid().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

// `POST /groups/:groupId/invites`: the bare row plus where it points. `path` is
// computed by the API, not a column — the sheet builds the QR and the copiable
// link from it, so neither app spells the invite URL.
export const createdInviteResponseSchema = inviteSchema.extend({
  path: z.string(),
});

// A roster row on the open invite: just enough to self-recognize.
const inviteGuestSchema = z.strictObject({
  groupMemberId: z.uuid(),
  displayName: z.string(),
  matchesCount: z.int(),
});

// The invite landing is public, so the inviter is named, never exposed: the
// shared member identity, not their account.
const publicInviteSchema = inviteSchema.extend({
  group: groupSchema,
  createdBy: memberUserSchema,
});

// `GET /invites/:token` and `GET /groups/:groupId/invites/:token`. OPEN answers
// the group's unclaimed guests; CLOSED answers its target's recognition. A
// closed invite whose target was taken over (or left) degrades to OPEN with
// `targetUnavailable`, so the opener still has a way in.
export const publicInviteResponseSchema = z.discriminatedUnion('kind', [
  publicInviteSchema.extend({
    kind: z.literal('OPEN'),
    guests: z.array(inviteGuestSchema),
    targetUnavailable: z.boolean(),
  }),
  publicInviteSchema.extend({
    kind: z.literal('CLOSED'),
    target: claimStubSummarySchema,
  }),
]);

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type CreatedInviteResponse = z.output<typeof createdInviteResponseSchema>;
export type CreatedInvite = z.input<typeof createdInviteResponseSchema>;
export type PublicInviteResponse = z.output<typeof publicInviteResponseSchema>;
export type PublicInvite = z.input<typeof publicInviteResponseSchema>;
// Dates stay out of a roster row, so one name serves both apps.
export type InviteGuest = z.infer<typeof inviteGuestSchema>;
