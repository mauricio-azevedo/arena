import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileSummaryStats } from '../types/profile-summary-stats.type';

@Injectable()
export class ProfileSummaryStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStats(userId: string): Promise<ProfileSummaryStats> {
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: {
        groupMember: {
          userId,
          leftAt: null,
        },
      },
      select: {
        team: true,
        match: {
          select: {
            winnerTeam: true,
          },
        },
      },
    });

    const matchesPlayed = matchPlayers.length;

    const wins = matchPlayers.filter(
      (matchPlayer) => matchPlayer.match.winnerTeam === matchPlayer.team,
    ).length;

    const losses = matchesPlayed - wins;

    const winRate =
      matchesPlayed === 0 ? 0 : Math.round((wins / matchesPlayed) * 100);

    return {
      matchesPlayed,
      wins,
      losses,
      winRate,
    };
  }
}
