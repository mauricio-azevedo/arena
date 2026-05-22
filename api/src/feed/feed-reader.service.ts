import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedScoreService } from './feed-score.service';

@Injectable()
export class FeedReaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedScore: FeedScoreService,
  ) {}

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

    const connectedMemberships = groupIds.length
      ? await this.prisma.groupMember.findMany({
          where: {
            groupId: {
              in: groupIds,
            },
            userId: {
              not: userId,
            },
            leftAt: null,
          },
          select: {
            userId: true,
          },
        })
      : [];

    const connectedUserIds = [
      ...new Set(connectedMemberships.map((membership) => membership.userId)),
    ];

    const items = await this.prisma.feedItem.findMany({
      where: {
        OR: [
          {
            visibility: 'GROUP_MEMBERS',
            groupId: {
              in: groupIds,
            },
          },
          {
            visibility: 'SOCIAL_CIRCLE',
            OR: [
              {
                actorUserId: userId,
              },
              {
                groupId: {
                  in: groupIds,
                },
              },
              {
                actorUserId: {
                  in: connectedUserIds,
                },
              },
            ],
          },
        ],
      },
      orderBy: [
        {
          occurredAt: 'desc',
        },
        {
          createdAt: 'desc',
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
        subjectUser: {
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
      isSubjectCurrentUser: item.subjectUserId === userId,
      feedScore: this.feedScore.calculateFeedScore({
        importanceScore: item.importanceScore,
        occurredAt: item.occurredAt,
      }),
    }));
  }
}
