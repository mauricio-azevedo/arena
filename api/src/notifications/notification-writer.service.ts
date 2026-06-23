import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import type { NotificationType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateNotificationInput } from './types/notification.types';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class NotificationWriterService {
  constructor(private readonly prisma: PrismaService) {}

  // Takes an optional tx so a notification is created in the same transaction as the
  // event that triggers it (e.g. a claim approval), never out of sync with it.
  create(input: CreateNotificationInput, tx: PrismaClientLike = this.prisma) {
    return tx.notification.create({
      data: {
        type: input.type,
        recipientUserId: input.recipientUserId,
        groupId: input.groupId ?? null,
        actorUserId: input.actorUserId ?? null,
        targetGroupMemberId: input.targetGroupMemberId ?? null,
        data: input.data,
      },
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientUserId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  // Records that the recipient acted on a notification (confirmed, declined) so the inbox
  // shows it as resolved. Acting implies seeing it, so we mark it read too.
  markActed(id: string, tx: PrismaClientLike = this.prisma) {
    return tx.notification.update({
      where: { id },
      data: { actedAt: new Date(), readAt: new Date() },
    });
  }

  // Resolves every still-open notification of a type that points at a given entity —
  // used when the underlying offer is confirmed, declined, superseded, or cleared, so the
  // stale notification (and its dead deep-link) stops being actionable in the inbox.
  markActedByTarget(
    type: NotificationType,
    targetGroupMemberId: string,
    tx: PrismaClientLike = this.prisma,
  ) {
    const now = new Date();
    return tx.notification.updateMany({
      where: { type, targetGroupMemberId, actedAt: null },
      data: { actedAt: now, readAt: now },
    });
  }
}
