import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileSummaryResponse } from '../types/profile-summary-response.type';
import { ProfileSummaryGroupsService } from './profile-summary-groups.service';
import { ProfileSummaryMatchesService } from './profile-summary-matches.service';
import { ProfileSummaryStatsService } from './profile-summary-stats.service';

@Injectable()
export class ProfileSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: ProfileSummaryStatsService,
    private readonly matches: ProfileSummaryMatchesService,
    private readonly groups: ProfileSummaryGroupsService,
  ) {}

  async getProfileSummary(userId: string): Promise<ProfileSummaryResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [stats, recentMatches, recentGroups] = await Promise.all([
      this.stats.calculateStats(userId),
      this.matches.findRecentMatches(userId),
      this.groups.findRecentGroups(userId),
    ]);

    return {
      user,
      stats,
      recentMatches,
      recentGroups,
    };
  }
}
