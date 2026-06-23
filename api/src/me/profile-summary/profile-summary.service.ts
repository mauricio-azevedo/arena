import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileSummaryResponse } from '../types/profile-summary-response.type';
import { ProfileSummaryGroupsService } from './profile-summary-groups.service';
import { ProfileSummaryMatchesService } from './profile-summary-matches.service';
import { ProfileSummaryPartnersService } from './profile-summary-partners.service';
import { ProfileSummaryStatsService } from './profile-summary-stats.service';

@Injectable()
export class ProfileSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: ProfileSummaryStatsService,
    private readonly partners: ProfileSummaryPartnersService,
    private readonly matches: ProfileSummaryMatchesService,
    private readonly groups: ProfileSummaryGroupsService,
  ) {}

  async getProfileSummary(
    userId: string,
    options: { includeEmail?: boolean } = {},
  ): Promise<ProfileSummaryResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [stats, partners, recentMatches, recentGroups] = await Promise.all([
      this.stats.calculateStats(userId),
      this.partners.findPartners(userId),
      this.matches.findRecentMatches(userId),
      this.groups.findRecentGroups(userId),
    ]);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: options.includeEmail ? user.email : null,
        memberSince: user.createdAt,
      },
      stats,
      bestPartner: partners.bestPartner,
      partners: partners.partners,
      partnerCount: partners.partnerCount,
      recentMatches,
      recentGroups,
    };
  }
}
