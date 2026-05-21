import { Injectable } from '@nestjs/common';
import { MatchTeam } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileSummaryMatch } from '../types/profile-summary-match.type';

@Injectable()
export class ProfileSummaryMatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findRecentMatches(profileUserId: string): Promise<ProfileSummaryMatch[]> {
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: {
        groupMember: {
          userId: profileUserId,
          leftAt: null,
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: 3,
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
          displayName: player.displayNameSnapshot,
        }));

      const teamB = match.players
        .filter((player) => player.team === MatchTeam.TEAM_B)
        .map((player) => ({
          userId: player.groupMember.userId,
          displayName: player.displayNameSnapshot,
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
      };
    });
  }
}
