import { Injectable } from '@nestjs/common';
import { resolveMemberDisplayName } from '../../common/member-display-name';
import { winRatePercent } from '../../common/win-rate';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileSummaryPartner } from '../types/profile-summary-partner.type';

// "Melhor dupla" needs enough games to be meaningful — below this we'd surface a
// 1–0 partner at 100% over a proven partnership.
const MIN_BEST_PARTNER_MATCHES = 3;

type MergedPartner = {
  userId: string | null;
  displayName: string;
  currentRank: number | null;
  // Games in the group that contributed `currentRank`, so the most-played group wins
  // the tie when a partner is merged across groups.
  rankSourceMatches: number;
  matchesTogether: number;
  winsTogether: number;
};

@Injectable()
export class ProfileSummaryPartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async findPartners(userId: string): Promise<{
    bestPartner: ProfileSummaryPartner | null;
    partners: ProfileSummaryPartner[];
    partnerCount: number;
  }> {
    const rows = await this.prisma.groupMemberPartnerStats.findMany({
      where: {
        groupMember: {
          userId,
          leftAt: null,
        },
      },
      select: {
        partnerMemberId: true,
        matchesTogether: true,
        winsTogether: true,
        partnerMember: {
          select: {
            userId: true,
            displayName: true,
            currentRank: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Merge the same partner across groups by their account; stub partners (no
    // account) stay distinct per membership.
    const merged = new Map<string, MergedPartner>();

    for (const row of rows) {
      const partner = row.partnerMember;
      const key = partner.userId
        ? `user:${partner.userId}`
        : `member:${row.partnerMemberId}`;

      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, {
          userId: partner.userId,
          displayName: resolveMemberDisplayName(partner),
          currentRank: partner.currentRank,
          rankSourceMatches: row.matchesTogether,
          matchesTogether: row.matchesTogether,
          winsTogether: row.winsTogether,
        });
        continue;
      }

      existing.matchesTogether += row.matchesTogether;
      existing.winsTogether += row.winsTogether;

      if (row.matchesTogether > existing.rankSourceMatches) {
        existing.rankSourceMatches = row.matchesTogether;
        existing.currentRank = partner.currentRank;
      }
    }

    const partners = Array.from(merged.values())
      .map((partner) => this.toPartner(partner))
      .sort(
        (a, b) =>
          b.winsTogether - a.winsTogether ||
          b.matchesTogether - a.matchesTogether ||
          b.winRate - a.winRate ||
          a.displayName.localeCompare(b.displayName),
      );

    return {
      bestPartner: this.pickBestPartner(partners),
      partners,
      partnerCount: partners.length,
    };
  }

  private toPartner(partner: MergedPartner): ProfileSummaryPartner {
    const lossesTogether = partner.matchesTogether - partner.winsTogether;
    const winRate = winRatePercent(
      partner.winsTogether,
      partner.matchesTogether,
    );

    return {
      userId: partner.userId,
      displayName: partner.displayName,
      currentRank: partner.currentRank,
      matchesTogether: partner.matchesTogether,
      winsTogether: partner.winsTogether,
      lossesTogether,
      winRate,
    };
  }

  // Highest win rate among partnerships with a meaningful sample; fall back to the
  // strongest partnership overall when none clears the bar, so the hero is never
  // empty while you have any partner.
  private pickBestPartner(
    partners: ProfileSummaryPartner[],
  ): ProfileSummaryPartner | null {
    if (partners.length === 0) {
      return null;
    }

    const eligible = partners.filter(
      (partner) => partner.matchesTogether >= MIN_BEST_PARTNER_MATCHES,
    );

    if (eligible.length === 0) {
      return partners[0];
    }

    return eligible.reduce((best, partner) =>
      partner.winRate > best.winRate ||
      (partner.winRate === best.winRate &&
        partner.matchesTogether > best.matchesTogether)
        ? partner
        : best,
    );
  }
}
