import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { NotificationView } from './types/notification.types';

const MAX_NOTIFICATIONS = 50;

@Injectable()
export class NotificationReaderService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<NotificationView[]> {
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
      data: (row.data ?? {}) as Record<string, unknown>,
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
