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
  userId: string;
  displayName: string;
  rating: number;
};

type RankingState = RatingState & {
  rank: number;
};

type MatchIdRow = {
  id: string;
};

type MatchForProjection = {
  id: string;
  groupId: string;
  gamesA: number;
  gamesB: number;
  playedAt: Date;
  players: Array<{
    id: string;
    groupMemberId: string;
    team: MatchTeam;
    position: number;
  }>;
};

type MatchMovementSnapshot = {
  groupMemberId: string;
  userId: string;
  displayName: string;
  direction: 'UP' | 'DOWN';
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  affectedMembers: Array<{
    groupMemberId: string;
    userId: string;
    displayName: string;
    rank: number | null;
  }>;
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
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const membersById = new Map<string, RatingState>(
      members.map((member) => {
        const displayName = this.getUserDisplayName(member.user);

        return [
          member.id,
          {
            id: member.id,
            name: displayName,
            userId: member.userId,
            displayName,
            rating: INITIAL_RATING,
          },
        ];
      }),
    );

    const activeMatchIds = await tx.$queryRaw<MatchIdRow[]>`
      SELECT "id"
      FROM "Match"
      WHERE "groupId" = ${groupId}
        AND "deletedAt" IS NULL
      ORDER BY "playedAt" ASC, "createdAt" ASC
    `;
    const matches = activeMatchIds.length
      ? ((await tx.match.findMany({
          where: {
            id: { in: activeMatchIds.map((match) => match.id) },
          },
          orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
          include: {
            players: {
              orderBy: [{ team: 'asc' }, { position: 'asc' }],
            },
          },
        })) as MatchForProjection[])
      : [];

    await tx.$executeRaw`
      UPDATE "Match"
      SET "processingStatus" = 'PROCESSING', "processingError" = NULL
      WHERE "groupId" = ${groupId}
        AND "processingStatus" IN ('PENDING', 'FAILED')
    `;

    await tx.$executeRaw`
      DELETE FROM "MatchRankingSnapshot"
      WHERE "groupId" = ${groupId}
    `;

    for (const match of matches) {
      await this.applyMatchRating(tx, match, membersById);
    }

    await tx.$executeRaw`
      UPDATE "Match"
      SET
        "processingStatus" = 'PROCESSED',
        "processedAt" = NOW(),
        "processingError" = NULL
      WHERE "groupId" = ${groupId}
        AND "deletedAt" IS NOT NULL
        AND "processingStatus" IN ('PENDING', 'PROCESSING', 'FAILED')
    `;

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
    match: MatchForProjection,
    membersById: Map<string, RatingState>,
  ) {
    const beforeRanking = this.buildRankingState(membersById);
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
    const updatedPlayerById = new Map(updatedPlayers.map((player) => [player.id, player]));

    for (const player of updatedPlayers) {
      const existingMember = membersById.get(player.id);

      if (!existingMember) {
        throw new Error('Invalid updated player');
      }

      membersById.set(player.id, {
        ...existingMember,
        rating: player.newRating,
      });
    }

    const afterRanking = this.buildRankingState(membersById);
    const movements = this.getMatchMovementSnapshots(match, beforeRanking, afterRanking);

    for (const player of match.players) {
      const before = beforeRanking.get(player.groupMemberId);
      const after = afterRanking.get(player.groupMemberId);
      const updatedPlayer = updatedPlayerById.get(player.groupMemberId);

      if (!before || !after || !updatedPlayer) {
        throw new Error('Invalid updated player');
      }

      const rankDelta = before.rank - after.rank;
      const movementDirection =
        rankDelta > 0 ? 'UP' : rankDelta < 0 ? 'DOWN' : null;
      const movementPositions = Math.abs(rankDelta);

      await tx.matchPlayer.update({
        where: { id: player.id },
        data: {
          ratingBefore: before.rating,
          ratingAfter: updatedPlayer.newRating,
          ratingDelta: updatedPlayer.newRating - before.rating,
          playedAt: match.playedAt,
        },
      });
      await tx.$executeRaw`
        UPDATE "MatchPlayer"
        SET
          "rankBefore" = ${before.rank},
          "rankAfter" = ${after.rank},
          "rankDelta" = ${rankDelta},
          "movementDirection" = ${movementDirection}::"RankingMovementDirection",
          "movementPositions" = ${movementPositions}
        WHERE "id" = ${player.id}
      `;
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
      },
    });

    await this.upsertMatchRankingSnapshot(tx, {
      groupId: match.groupId,
      matchId: match.id,
      previousLeaders: this.getLeaders(beforeRanking),
      currentLeaders: this.getLeaders(afterRanking),
      dethronedLeaders: this.getDethronedLeaders(beforeRanking, afterRanking),
      movements,
    });

    await tx.$executeRaw`
      UPDATE "Match"
      SET
        "processingStatus" = 'PROCESSED',
        "processedAt" = NOW(),
        "processingError" = NULL
      WHERE "id" = ${match.id}
    `;
  }

  private buildRankingState(membersById: Map<string, RatingState>) {
    const sortedMembers = [...membersById.values()].sort((a, b) => {
      const ratingComparison = b.rating - a.rating;

      if (ratingComparison !== 0) {
        return ratingComparison;
      }

      return a.id.localeCompare(b.id);
    });
    const rankingByMemberId = new Map<string, RankingState>();
    let currentRank = 0;
    let previousRating: number | null = null;

    for (const member of sortedMembers) {
      if (previousRating === null || member.rating !== previousRating) {
        currentRank += 1;
        previousRating = member.rating;
      }

      rankingByMemberId.set(member.id, {
        ...member,
        rank: currentRank,
      });
    }

    return rankingByMemberId;
  }

  private getMatchMovementSnapshots(
    match: MatchForProjection,
    beforeRanking: Map<string, RankingState>,
    afterRanking: Map<string, RankingState>,
  ): MatchMovementSnapshot[] {
    const movements: MatchMovementSnapshot[] = [];

    for (const player of match.players) {
      const before = beforeRanking.get(player.groupMemberId);
      const after = afterRanking.get(player.groupMemberId);

      if (!before || !after || before.rank === after.rank) {
        continue;
      }

      const direction = after.rank < before.rank ? 'UP' : 'DOWN';
      movements.push({
        groupMemberId: after.id,
        userId: after.userId,
        displayName: after.displayName,
        direction,
        positions: Math.abs(before.rank - after.rank),
        previousRank: before.rank,
        currentRank: after.rank,
        previousRating: before.rating,
        currentRating: after.rating,
        affectedMembers: this.getPassedGroupMembers({
          groupMemberId: after.id,
          direction,
          previousRank: before.rank,
          currentRank: after.rank,
          beforeRanking,
        }),
      });
    }

    return movements;
  }

  private getPassedGroupMembers({
    groupMemberId,
    direction,
    previousRank,
    currentRank,
    beforeRanking,
  }: {
    groupMemberId: string;
    direction: 'UP' | 'DOWN';
    previousRank: number;
    currentRank: number;
    beforeRanking: Map<string, RankingState>;
  }) {
    return [...beforeRanking.values()]
      .filter((member) => {
        if (member.id === groupMemberId) {
          return false;
        }

        if (direction === 'UP') {
          return member.rank >= currentRank && member.rank < previousRank;
        }

        return member.rank <= currentRank && member.rank > previousRank;
      })
      .map((member) => ({
        groupMemberId: member.id,
        userId: member.userId,
        displayName: member.displayName,
        rank: member.rank,
      }));
  }

  private getLeaders(ranking: Map<string, RankingState>) {
    return [...ranking.values()]
      .filter((member) => member.rank === 1)
      .map((member) => this.toPlayerSnapshot(member));
  }

  private getDethronedLeaders(
    beforeRanking: Map<string, RankingState>,
    afterRanking: Map<string, RankingState>,
  ) {
    return this.getLeaders(beforeRanking).filter((leader) => {
      const after = afterRanking.get(leader.groupMemberId);
      return after?.rank !== 1;
    });
  }

  private toPlayerSnapshot(member: RankingState) {
    return {
      groupMemberId: member.id,
      userId: member.userId,
      displayName: member.displayName,
    };
  }

  private async upsertMatchRankingSnapshot(
    tx: Prisma.TransactionClient,
    input: {
      groupId: string;
      matchId: string;
      previousLeaders: unknown[];
      currentLeaders: unknown[];
      dethronedLeaders: unknown[];
      movements: unknown[];
    },
  ) {
    const previousLeaders = JSON.stringify(input.previousLeaders);
    const currentLeaders = JSON.stringify(input.currentLeaders);
    const dethronedLeaders = JSON.stringify(input.dethronedLeaders);
    const movements = JSON.stringify(input.movements);

    await tx.$executeRaw`
      INSERT INTO "MatchRankingSnapshot" (
        "matchId",
        "groupId",
        "previousLeaders",
        "currentLeaders",
        "dethronedLeaders",
        "movements",
        "algorithmVersion",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${input.matchId},
        ${input.groupId},
        ${previousLeaders}::jsonb,
        ${currentLeaders}::jsonb,
        ${dethronedLeaders}::jsonb,
        ${movements}::jsonb,
        ${RATING_ALGORITHM},
        NOW(),
        NOW()
      )
      ON CONFLICT ("matchId") DO UPDATE SET
        "groupId" = EXCLUDED."groupId",
        "previousLeaders" = EXCLUDED."previousLeaders",
        "currentLeaders" = EXCLUDED."currentLeaders",
        "dethronedLeaders" = EXCLUDED."dethronedLeaders",
        "movements" = EXCLUDED."movements",
        "algorithmVersion" = EXCLUDED."algorithmVersion",
        "updatedAt" = NOW()
    `;
  }

  private getUserDisplayName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
