import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateNotificationInput } from './types/notification.types';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class NotificationWriterService {
  constructor(private readonly prisma: PrismaService) {}

  // One place that maps an input to a notification row, so create() and createMany() can't
  // drift on the nullable-field defaults.
  private toRow(
    input: CreateNotificationInput,
  ): Prisma.NotificationCreateManyInput {
    return {
      type: input.type,
      recipientUserId: input.recipientUserId,
      groupId: input.groupId ?? null,
      actorUserId: input.actorUserId ?? null,
      data: input.data,
    };
  }

  // Takes an optional tx so a notification is created in the same transaction as the
  // event that triggers it (e.g. a guest take-over), never out of sync with it.
  create(input: CreateNotificationInput, tx: PrismaClientLike = this.prisma) {
    return tx.notification.create({ data: this.toRow(input) });
  }

  // Fan-out: one insert for many recipients (e.g. notifying every group admin), instead
  // of a create() per recipient inside a transaction.
  createMany(
    inputs: CreateNotificationInput[],
    tx: PrismaClientLike = this.prisma,
  ) {
    return tx.notification.createMany({
      data: inputs.map((i) => this.toRow(i)),
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientUserId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    return result.count;
  }
}
