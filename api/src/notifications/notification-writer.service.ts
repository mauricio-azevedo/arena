import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
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

  // Records that the recipient acted on a notification (approved, declined, claimed)
  // so the inbox can show it as resolved.
  markActed(id: string, tx: PrismaClientLike = this.prisma) {
    return tx.notification.update({
      where: { id },
      data: { actedAt: new Date() },
    });
  }
}
