import { Injectable } from '@nestjs/common';
import type { NotificationResponse } from '@arena/contracts/notifications';
import { PrismaService } from '../prisma/prisma.service';

const MAX_NOTIFICATIONS = 50;

@Injectable()
export class NotificationReaderService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<NotificationResponse[]> {
    const rows = await this.prisma.notification.findMany({
      where: { recipientUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_NOTIFICATIONS,
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      groupId: row.groupId,
      actorUserId: row.actorUserId,
      // A JSON column: whoever wrote the row owns the shape. The cast is the
      // promise, kept honest by the contract parse in the e2e spec.
      data: (row.data ?? {}) as NotificationResponse['data'],
      read: row.readAt !== null,
      acted: row.actedAt !== null,
      createdAt: row.createdAt,
    }));
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientUserId: userId, readAt: null },
    });
  }
}
