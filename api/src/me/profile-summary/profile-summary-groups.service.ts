import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileSummaryGroup } from '../types/profile-summary-group.type';

@Injectable()
export class ProfileSummaryGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findRecentGroups(userId: string): Promise<ProfileSummaryGroup[]> {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      include: {
        group: true,
        matchPlayers: {
          orderBy: {
            playedAt: 'desc',
          },
          take: 1,
          select: {
            playedAt: true,
          },
        },
      },
    });

    return memberships
      .map((membership) => ({
        id: membership.group.id,
        name: membership.group.name,
        description: membership.group.description,
        rating: membership.rating,
        role: membership.role,
        lastPlayedAt: membership.matchPlayers[0]?.playedAt ?? null,
      }))
      .sort((a, b) => {
        if (!a.lastPlayedAt && !b.lastPlayedAt) {
          return 0;
        }

        if (!a.lastPlayedAt) {
          return 1;
        }

        if (!b.lastPlayedAt) {
          return -1;
        }

        return b.lastPlayedAt.getTime() - a.lastPlayedAt.getTime();
      })
      .slice(0, 2);
  }
}
