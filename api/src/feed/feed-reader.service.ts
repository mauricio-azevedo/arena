import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedReaderService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserFeed(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      select: {
        groupId: true,
      },
    });

    const groupIds = memberships.map((membership) => membership.groupId);

    if (groupIds.length === 0) {
      return [];
    }

    const items = await this.prisma.feedItem.findMany({
      where: {
        groupId: {
          in: groupIds,
        },
      },
      orderBy: [
        {
          importanceScore: 'desc',
        },
        {
          occurredAt: 'desc',
        },
      ],
      take: 30,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        actorUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return items.map((item) => ({
      ...item,
      isActorCurrentUser: item.actorUserId === userId,
    }));
  }
}
