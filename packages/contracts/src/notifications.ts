import { z } from 'zod';
import { isoDateTime } from './iso-datetime';

// Response-only: every route of the inbox acts on the caller's own
// notifications, taken from the token, so there is no body to parse.

// One moment so far. The retired claim flows' values were dropped from the
// column with their rows, so nothing in the inbox can carry one.
export const notificationTypeSchema = z.enum(['GUEST_TAKEN_OVER']);

// A deep link the card offers while the notification is still actionable.
const notificationActionSchema = z.strictObject({
  label: z.string(),
  href: z.string(),
});

// The render payload, denormalized and frozen at write time, so a notification
// reads the way it did when it happened even after the group is renamed. Every
// field is optional: a writer sends what its moment has (an informational one
// has no actions).
const notificationDataSchema = z.strictObject({
  title: z.string().optional(),
  body: z.string().optional(),
  meta: z.string().optional(),
  actions: z.array(notificationActionSchema).optional(),
});

// `GET /me/notifications`: the caller's 50 most recent, newest first.
export const notificationSchema = z.strictObject({
  id: z.uuid(),
  type: notificationTypeSchema,
  // Null when the moment is about no particular group.
  groupId: z.uuid().nullable(),
  actorUserId: z.uuid().nullable(),
  data: notificationDataSchema,
  read: z.boolean(),
  // Settled — confirmed, declined, or superseded by a later state change. The
  // card then drops its (now dead) action and reads as history.
  acted: z.boolean(),
  createdAt: isoDateTime,
});

// `GET /me/notifications/unread-count`: what the bell's badge needs, nothing more.
export const unreadNotificationCountResponseSchema = z.strictObject({
  count: z.int(),
});

// `POST /me/notifications/read`: how many rows the sweep marked read.
export const notificationsReadResponseSchema = z.strictObject({
  updated: z.int(),
});

// Convention for every module: `XResponse` = `z.output` (API), the resource
// name = `z.input` (web), one name when the two coincide.
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationAction = z.infer<typeof notificationActionSchema>;
export type NotificationResponse = z.output<typeof notificationSchema>;
export type AppNotification = z.input<typeof notificationSchema>;
export type UnreadNotificationCountResponse = z.infer<typeof unreadNotificationCountResponseSchema>;
export type NotificationsReadResponse = z.infer<typeof notificationsReadResponseSchema>;
