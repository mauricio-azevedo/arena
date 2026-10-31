import { Injectable, NotFoundException } from '@nestjs/common';
import type { MemberProfileResponse } from '@arena/contracts/members';
import type {
  ProfileMatchListItemResponse,
  ProfileSummaryStats,
} from '@arena/contracts/profiles';
import { MatchTeam } from '../generated/prisma/enums';
import {
  MEMBER_USER_SELECT,
  resolveMemberAvatarColor,
  resolveMemberDisplayName,
} from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import { RECENT_FORM_SIZE } from '../me/profile-summary/profile-summary-stats.service';
import { winRatePercent } from '../common/win-rate';

@Injectable()
export class MemberProfileReaderService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberProfile(
    groupId: string,
    memberId: string,
  ): Promise<MemberProfileResponse> {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
      select: {
        id: true,
        groupId: true,
        userId: true,
        displayName: true,
        rating: true,
        currentRank: true,
        user: {
          select: {
            ...MEMBER_USER_SELECT,
          },
        },
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
      avatarColor: resolveMemberAvatarColor(member),
      rating: member.rating,
      rank: member.currentRank,
      stats: this.statsFromMatches(matches),
      matches,
    };
  }

  // The match list already carries each result, so stats derive from it — no
  // separate matchPlayer query.
  private statsFromMatches(
    matches: ProfileMatchListItemResponse[],
  ): ProfileSummaryStats {
    const matchesPlayed = matches.length;
    const wins = matches.filter((match) => match.result === 'WIN').length;
    const losses = matchesPlayed - wins;
    const winRate = winRatePercent(wins, matchesPlayed);
    // Matches are ordered most-recent-first, so the head is the recent form.
    const recentForm = matches
      .slice(0, RECENT_FORM_SIZE)
      .map((match) => match.result);

    return { matchesPlayed, wins, losses, winRate, recentForm };
  }

  // Mirrors me/profile-matches but scoped to a single membership (groupMemberId)
  // instead of a userId — so it works for stub players too.
  private async findMatches(
    groupMemberId: string,
  ): Promise<ProfileMatchListItemResponse[]> {
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
                    user: {
                      select: {
                        ...MEMBER_USER_SELECT,
                      },
                    },
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
