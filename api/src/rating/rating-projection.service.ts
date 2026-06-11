import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { MatchTeam } from '../generated/prisma/enums';
import { structuredLog } from '../observability/structured-log';
import { calculateBeachRating } from './calculate-beach-rating';

const INITIAL_RATING = 1000;
const RATING_ALGORITHM = 'BEACH_ELO_V1';

type RatingState = {
  id: string;
  name: string;
  rating: number;
};

@Injectable()
export class RatingProjectionService {
  private readonly logger = new Logger(RatingProjectionService.name);

  async syncGroupRatings(tx: Prisma.TransactionClient, groupId: string) {
    const startedAt = Date.now();

    const members = await tx.groupMember.findMany({
      where: { groupId, leftAt: null },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const membersById = new Map<string, RatingState>(
      members.map((member) => [
        member.id,
        {
          id: member.id,
          name: this.getUserDisplayName(member.user),
          rating: INITIAL_RATING,
        },
      ]),
    );

    const matches = await tx.match.findMany({
      where: {
        groupId,
        deletedAt: null,
      },
      orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
      include: {
        players: {
          orderBy: [{ team: 'asc' }, { position: 'asc' }],
        },
      },
    });

    await tx.match.updateMany({
      where: {
        groupId,
        processingStatus: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        processingStatus: 'PROCESSING',
        processingError: null,
      },
    });

    for (const match of matches) {
      await this.applyMatchRating(tx, match, membersById);
    }

    await tx.match.updateMany({
      where: {
        groupId,
        deletedAt: { not: null },
        processingStatus: { in: ['PENDING', 'PROCESSING', 'FAILED'] },
      },
      data: {
        processingStatus: 'PROCESSED',
        processedAt: new Date(),
        processingError: null,
      },
    });

    for (const member of membersById.values()) {
      await tx.groupMember.update({
        where: { id: member.id },
        data: {
          rating: member.rating,
          ratingAlgorithm: RATING_ALGORITHM,
        },
      });
    }

    this.logger.log(
      structuredLog('rating_projection.completed', {
        groupId,
        matchesCount: matches.length,
        membersCount: members.length,
        durationMs: Date.now() - startedAt,
      }),
    );
  }

  private async applyMatchRating(
    tx: Prisma.TransactionClient,
    match: {
      id: string;
      gamesA: number;
      gamesB: number;
      playedAt: Date;
      players: Array<{
        id: string;
        groupMemberId: string;
        team: MatchTeam;
        position: number;
      }>;
    },
    membersById: Map<string, RatingState>,
  ) {
    const teamAPlayers = match.players
      .filter((player) => player.team === MatchTeam.TEAM_A)
      .sort((a, b) => a.position - b.position);
    const teamBPlayers = match.players
      .filter((player) => player.team === MatchTeam.TEAM_B)
      .sort((a, b) => a.position - b.position);

    if (teamAPlayers.length !== 2 || teamBPlayers.length !== 2) {
      throw new Error('Invalid match players');
    }

    const teamAPlayer1 = membersById.get(teamAPlayers[0].groupMemberId);
    const teamAPlayer2 = membersById.get(teamAPlayers[1].groupMemberId);
    const teamBPlayer1 = membersById.get(teamBPlayers[0].groupMemberId);
    const teamBPlayer2 = membersById.get(teamBPlayers[1].groupMemberId);

    if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1 || !teamBPlayer2) {
      throw new Error('Invalid match players');
    }

    const teamARatingBefore = (teamAPlayer1.rating + teamAPlayer2.rating) / 2;
    const teamBRatingBefore = (teamBPlayer1.rating + teamBPlayer2.rating) / 2;
    const result = calculateBeachRating({
      teamA: [teamAPlayer1, teamAPlayer2],
      teamB: [teamBPlayer1, teamBPlayer2],
      gamesA: match.gamesA,
      gamesB: match.gamesB,
    });
    const updatedPlayers = [...result.teamA.players, ...result.teamB.players];
    const playerById = new Map(updatedPlayers.map((player) => [player.id, player]));

    for (const player of updatedPlayers) {
      membersById.set(player.id, {
        id: player.id,
        name: player.name,
        rating: player.newRating,
      });
    }

    for (const player of match.players) {
      const before = this.getPlayerBeforeRating(
        player.groupMemberId,
        teamAPlayers,
        teamBPlayers,
        teamAPlayer1,
        teamAPlayer2,
        teamBPlayer1,
        teamBPlayer2,
      );
      const updatedPlayer = playerById.get(player.groupMemberId);

      if (!updatedPlayer) {
        throw new Error('Invalid updated player');
      }

      await tx.matchPlayer.update({
        where: { id: player.id },
        data: {
          ratingBefore: before,
          ratingAfter: updatedPlayer.newRating,
          ratingDelta: updatedPlayer.newRating - before,
          playedAt: match.playedAt,
        },
      });
    }

    const teamARatingAfter =
      (result.teamA.players[0].newRating + result.teamA.players[1].newRating) / 2;
    const teamBRatingAfter =
      (result.teamB.players[0].newRating + result.teamB.players[1].newRating) / 2;

    await tx.match.update({
      where: { id: match.id },
      data: {
        winnerTeam: match.gamesA > match.gamesB ? MatchTeam.TEAM_A : MatchTeam.TEAM_B,
        teamAExpected: result.teamA.expected,
        teamBExpected: result.teamB.expected,
        teamAActual: result.teamA.actual,
        teamBActual: result.teamB.actual,
        teamARatingBefore,
        teamBRatingBefore,
        teamARatingAfter,
        teamBRatingAfter,
        ratingAlgorithm: RATING_ALGORITHM,
        processingStatus: 'PROCESSED',
        processedAt: new Date(),
        processingError: null,
      },
    });
  }

  private getPlayerBeforeRating(
    groupMemberId: string,
    teamAPlayers: { groupMemberId: string }[],
    teamBPlayers: { groupMemberId: string }[],
    teamAPlayer1: RatingState,
    teamAPlayer2: RatingState,
    teamBPlayer1: RatingState,
    teamBPlayer2: RatingState,
  ) {
    if (groupMemberId === teamAPlayers[0].groupMemberId) return teamAPlayer1.rating;
    if (groupMemberId === teamAPlayers[1].groupMemberId) return teamAPlayer2.rating;
    if (groupMemberId === teamBPlayers[0].groupMemberId) return teamBPlayer1.rating;
    if (groupMemberId === teamBPlayers[1].groupMemberId) return teamBPlayer2.rating;
    throw new Error('Invalid player');
  }

  private getUserDisplayName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
