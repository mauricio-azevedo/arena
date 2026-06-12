import { Injectable } from '@nestjs/common';
import { MatchTeam } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileMatchListItem } from '../types/profile-match-list-item.type';

type MatchIdRow = {
  id: string;
};

@Injectable()
export class ProfileMatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMatches(profileUserId: string): Promise<ProfileMatchListItem[]> {
    const activeMatches = await this.prisma.$queryRaw<MatchIdRow[]>`
      SELECT m."id"
      FROM "Match" m
      INNER JOIN "MatchPlayer" mp ON mp."matchId" = m."id"
      INNER JOIN "GroupMember" gm ON gm."id" = mp."groupMemberId"
      WHERE gm."userId" = ${profileUserId}
        AND gm."leftAt" IS NULL
        AND m."deletedAt" IS NULL
      ORDER BY m."playedAt" DESC, m."createdAt" DESC
    `;

    if (activeMatches.length === 0) {
      return [];
    }

    const matchIds = activeMatches.map((match) => match.id);
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: {
        matchId: { in: matchIds },
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
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
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
          displayName: this.getUserDisplayName(player.groupMember.user),
        }));

      const teamB = match.players
        .filter((player) => player.team === MatchTeam.TEAM_B)
        .map((player) => ({
          userId: player.groupMember.userId,
          displayName: this.getUserDisplayName(player.groupMember.user),
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

  private getUserDisplayName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
