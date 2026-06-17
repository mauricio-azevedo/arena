import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UserDisplayNameInput = {
  firstName: string;
  lastName: string;
};

@Injectable()
export class PlatformTrendingPlayersReadService {
  constructor(private readonly prisma: PrismaService) {}

  async listTrendingPlayers() {
    const players = await this.prisma.platformTrendingPlayer.findMany({
      orderBy: { trendRank: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        highlightGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        highlightGroupMember: {
          select: {
            id: true,
            groupId: true,
            currentRank: true,
            rating: true,
          },
        },
      },
    });

    return players.map((player) => ({
      userId: player.userId,
      displayName: this.getUserDisplayName(player.user),
      trendRank: player.trendRank,
      score: player.score,
      recentMatches: player.recentMatches,
      recentWins: player.recentWins,
      recentWinRate: player.recentWinRate,
      allTimeMatches: player.allTimeMatches,
      allTimeWins: player.allTimeWins,
      allTimeWinRate: player.allTimeWinRate,
      windowDays: player.windowDays,
      windowStartedAt: player.windowStartedAt.toISOString(),
      windowEndedAt: player.windowEndedAt.toISOString(),
      computedAt: player.computedAt.toISOString(),
      highlightGroup: player.highlightGroup
        ? {
            id: player.highlightGroup.id,
            name: player.highlightGroup.name,
          }
        : null,
      highlightGroupMember: player.highlightGroupMember
        ? {
            id: player.highlightGroupMember.id,
            groupId: player.highlightGroupMember.groupId,
            currentRank: player.highlightGroupMember.currentRank,
            rating: player.highlightGroupMember.rating,
          }
        : null,
    }));
  }

  private getUserDisplayName(user: UserDisplayNameInput) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
