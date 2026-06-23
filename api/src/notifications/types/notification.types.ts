import type { Prisma } from '../../generated/prisma/client';
import type { NotificationType } from '../../generated/prisma/enums';

export type CreateNotificationInput = {
  type: NotificationType;
  recipientUserId: string;
  groupId?: string | null;
  actorUserId?: string | null;
  // The entity this is about (e.g. a stub), so the notification can be resolved when that
  // entity's state changes. See NotificationWriterService.markActedByTarget.
  targetGroupMemberId?: string | null;
  // Denormalized render payload (names, counts, deep-link refs). Frozen at write time.
  data: Prisma.InputJsonValue;
};

export type NotificationView = {
  id: string;
  type: NotificationType;
  groupId: string | null;
  actorUserId: string | null;
  data: Record<string, unknown>;
  read: boolean;
  acted: boolean;
  createdAt: Date;
};
