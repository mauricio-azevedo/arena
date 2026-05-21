import { Injectable } from '@nestjs/common';
import { MatchTeam } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileMatchListItem } from '../types/profile-match-list-item.type';

@Injectable()
export class ProfileMatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMatches(profileUserId: string): Promise<ProfileMatchListItem[]> {
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

        ratingBefore: matchPlayer.ratingBefore,
        ratingAfter: matchPlayer.ratingAfter,
        ratingDelta: matchPlayer.ratingDelta,
      };
    });
  }
}
