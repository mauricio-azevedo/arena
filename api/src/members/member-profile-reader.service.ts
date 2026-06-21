import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchTeam } from '../generated/prisma/enums';
import { resolveMemberDisplayName } from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import type { ProfileMatchListItem } from '../me/types/profile-match-list-item.type';
import type { ProfileSummaryStats } from '../me/types/profile-summary-stats.type';
import type { MemberProfile } from './types/member-profile.type';

@Injectable()
export class MemberProfileReaderService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberProfile(
    groupId: string,
    memberId: string,
  ): Promise<MemberProfile> {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
      select: {
        id: true,
        groupId: true,
        userId: true,
        displayName: true,
        rating: true,
        currentRank: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    const matches = await this.findMatches(memberId);

    return {
      groupMemberId: member.id,
      groupId: member.groupId,
      userId: member.userId,
      displayName: resolveMemberDisplayName(member),
      rating: member.rating,
      currentRank: member.currentRank,
      stats: this.statsFromMatches(matches),
      matches,
    };
  }

  // The match list already carries each result, so stats derive from it — no
  // separate matchPlayer query.
  private statsFromMatches(
    matches: ProfileMatchListItem[],
  ): ProfileSummaryStats {
    const matchesPlayed = matches.length;
    const wins = matches.filter((match) => match.result === 'WIN').length;
    const losses = matchesPlayed - wins;
    const winRate =
      matchesPlayed === 0 ? 0 : Math.round((wins / matchesPlayed) * 100);

    return { matchesPlayed, wins, losses, winRate };
  }

  // Mirrors me/profile-matches but scoped to a single membership (groupMemberId)
  // instead of a userId — so it works for stub players too.
  private async findMatches(
    groupMemberId: string,
  ): Promise<ProfileMatchListItem[]> {
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: {
        groupMemberId,
        match: { deletedAt: null },
      },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        match: {
          include: {
            group: true,
            players: {
              orderBy: [{ team: 'asc' }, { position: 'asc' }],
              include: {
                groupMember: {
                  select: {
                    userId: true,
                    displayName: true,
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return matchPlayers.map((matchPlayer) => {
      const match = matchPlayer.match;

      const teamA = match.players
        .filter((player) => player.team === MatchTeam.TEAM_A)
        .map((player) => ({
          userId: player.groupMember.userId,
          displayName: resolveMemberDisplayName(player.groupMember),
        }));

      const teamB = match.players
        .filter((player) => player.team === MatchTeam.TEAM_B)
        .map((player) => ({
          userId: player.groupMember.userId,
          displayName: resolveMemberDisplayName(player.groupMember),
        }));

      return {
        id: match.id,
        groupId: match.groupId,
        groupName: match.group.name,
        playedAt: match.playedAt,
        gamesA: match.gamesA,
        gamesB: match.gamesB,
        winnerTeam: match.winnerTeam,
        result: match.winnerTeam === matchPlayer.team ? 'WIN' : 'LOSS',
        teamA,
        teamB,
        ratingBefore: matchPlayer.ratingBefore,
        ratingAfter: matchPlayer.ratingAfter,
        ratingDelta: matchPlayer.ratingDelta,
      };
    });
  }
}
