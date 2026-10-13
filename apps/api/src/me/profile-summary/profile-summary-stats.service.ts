import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { winRatePercent } from '../../common/win-rate';
import type { ProfileSummaryMatchResult } from '../types/profile-summary-match-result.type';
import type { ProfileSummaryStats } from '../types/profile-summary-stats.type';

export const RECENT_FORM_SIZE = 8;

@Injectable()
export class ProfileSummaryStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStats(userId: string): Promise<ProfileSummaryStats> {
    const [totals, recentForm] = await Promise.all([
      this.aggregateTotals(userId),
      this.loadRecentForm(userId),
    ]);

    const { matchesPlayed, wins } = totals;
    const losses = matchesPlayed - wins;
    const winRate = winRatePercent(wins, matchesPlayed);

    return { matchesPlayed, wins, losses, winRate, recentForm };
  }

  // Sum the per-group GroupMemberStats read model instead of scanning every
  // MatchPlayer at read time. Absent rows (groups with no processed matches yet)
  // simply contribute nothing.
  private async aggregateTotals(userId: string) {
    const totals = await this.prisma.groupMemberStats.aggregate({
      where: {
        groupMember: {
          userId,
          leftAt: null,
        },
      },
      _sum: {
        matchesCount: true,
        winsCount: true,
      },
    });

    return {
      matchesPlayed: totals._sum.matchesCount ?? 0,
      wins: totals._sum.winsCount ?? 0,
    };
  }

  private async loadRecentForm(
    userId: string,
  ): Promise<ProfileSummaryMatchResult[]> {
    const recent = await this.prisma.matchPlayer.findMany({
      where: {
        groupMember: {
          userId,
          leftAt: null,
        },
        match: {
          deletedAt: null,
          winnerTeam: { not: null },
        },
      },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      take: RECENT_FORM_SIZE,
      select: {
        team: true,
        match: {
          select: {
            winnerTeam: true,
          },
        },
      },
    });

    return recent.map((matchPlayer) =>
      matchPlayer.match.winnerTeam === matchPlayer.team ? 'WIN' : 'LOSS',
    );
  }
}
