import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MatchTeam } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';
import { structuredLog } from '../observability/structured-log';

type RankingDirection = 'UP' | 'DOWN';

type RankingMemberState = {
  id: string;
  rating: number;
  rank: number;
};

type MatchForRanking = {
  id: string;
  playedAt: Date;
  createdAt: Date;
  players: Array<{
    groupMemberId: string;
    team?: MatchTeam;
    position?: number;
    ratingBefore: number;
    ratingAfter: number;
  }>;
};

type RankingMovementToPersist = {
  id: string;
  groupId: string;
  groupMemberId: string;
  matchId: string;
  direction: RankingDirection;
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  passedGroupMemberIds: string[];
  occurredAt: Date;
  isVisible: boolean;
};

type MatchParticipation = {
  matchId: string;
  participatingMemberIds: Set<string>;
};

type MatchIdRow = {
  id: string;
};

@Injectable()
export class RankingMovementService {
  private readonly logger = new Logger(RankingMovementService.name);

  async syncLatestMatchRankingState(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchId: string,
  ) {
    const startedAt = Date.now();
    const activeMembers = await tx.groupMember.findMany({
      where: { groupId, leftAt: null },
      select: { id: true, rating: true },
    });

    if (activeMembers.length === 0) {
      this.logger.log(
        structuredLog('ranking_projection.skipped', {
          groupId,
          matchId,
          strategy: 'incremental',
          reason: 'NO_ACTIVE_MEMBERS',
          durationMs: Date.now() - startedAt,
        }),
      );
      return;
    }

    const activeMatchRows = await tx.$queryRaw<MatchIdRow[]>`
      SELECT "id"
      FROM "Match"
      WHERE "id" = ${matchId}
        AND "groupId" = ${groupId}
        AND "deletedAt" IS NULL
      LIMIT 1
    `;

    if (activeMatchRows.length === 0) {
      this.logger.warn(
        structuredLog('ranking_projection.skipped', {
          groupId,
          matchId,
          strategy: 'incremental',
          reason: 'MATCH_NOT_FOUND',
          activeMembersCount: activeMembers.length,
          durationMs: Date.now() - startedAt,
        }),
      );
      return;
    }

    const match = await tx.match.findFirst({
      where: { id: matchId, groupId },
      select: {
        id: true,
        playedAt: true,
        createdAt: true,
        players: {
          select: {
            groupMemberId: true,
            ratingBefore: true,
            ratingAfter: true,
          },
        },
      },
    });

    if (!match) {
      this.logger.warn(
        structuredLog('ranking_projection.skipped', {
          groupId,
          matchId,
          strategy: 'incremental',
          reason: 'MATCH_NOT_FOUND',
          activeMembersCount: activeMembers.length,
          durationMs: Date.now() - startedAt,
        }),
      );
      return;
    }

    const memberIds = new Set(activeMembers.map((member) => member.id));
    const afterRatingByMemberId = new Map(
      activeMembers.map((member) => [member.id, member.rating]),
    );
    const beforeRatingByMemberId = new Map(afterRatingByMemberId);
    const participatingMemberIds = new Set<string>();

    for (const player of match.players) {
      if (!memberIds.has(player.groupMemberId)) {
        continue;
      }

      participatingMemberIds.add(player.groupMemberId);
      beforeRatingByMemberId.set(player.groupMemberId, player.ratingBefore);
      afterRatingByMemberId.set(player.groupMemberId, player.ratingAfter);
    }

    const beforeRanking = this.buildRankingState(beforeRatingByMemberId);
    const afterRanking = this.buildRankingState(afterRatingByMemberId);
    const movements = this.detectMatchMovements({
      groupId,
      match,
      participatingMemberIds,
      beforeRanking,
      afterRanking,
    });

    this.logDetectedMovements({
      groupId,
      matchId,
      strategy: 'incremental',
      movements,
      participatingMemberIds,
    });

    await this.invalidateVisibleMovementsChangedByRanking(
      tx,
      groupId,
      afterRanking,
    );
    await this.invalidateVisibleMovementsForParticipants(
      tx,
      groupId,
      participatingMemberIds,
    );

    for (const movement of movements) {
      movement.isVisible = true;
      await this.upsertRankingMovement(tx, movement);
    }

    await this.updateCurrentRanks(tx, afterRanking);

    this.logger.log(
      structuredLog('ranking_projection.completed', {
        groupId,
        matchId,
        strategy: 'incremental',
        activeMembersCount: activeMembers.length,
        participatingMembersCount: participatingMemberIds.size,
        movementsDetected: movements.length,
        visibleMovements: movements.filter((movement) => movement.isVisible)
          .length,
        durationMs: Date.now() - startedAt,
      }),
    );
  }

  async syncGroupRankingState(tx: Prisma.TransactionClient, groupId: string) {
    const startedAt = Date.now();
    const activeMembers = await tx.groupMember.findMany({
      where: { groupId, leftAt: null },
      select: { id: true, rating: true },
    });

    await this.clearGroupRankingMovementState(tx, groupId);

    if (activeMembers.length === 0) {
      this.logger.log(
        structuredLog('ranking_projection.skipped', {
          groupId,
          strategy: 'full_rebuild',
          reason: 'NO_ACTIVE_MEMBERS',
          durationMs: Date.now() - startedAt,
        }),
      );
      return;
    }

    const activeMatchIds = await tx.$queryRaw<MatchIdRow[]>`
      SELECT "id"
      FROM "Match"
      WHERE "groupId" = ${groupId}
        AND "deletedAt" IS NULL
      ORDER BY "playedAt" ASC, "createdAt" ASC
    `;
    const matches = activeMatchIds.length
      ? await tx.match.findMany({
          where: { id: { in: activeMatchIds.map((match) => match.id) } },
          orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            playedAt: true,
            createdAt: true,
            players: {
              orderBy: [{ team: 'asc' }, { position: 'asc' }],
              select: {
                groupMemberId: true,
                team: true,
                position: true,
                ratingBefore: true,
                ratingAfter: true,
              },
            },
          },
        })
      : [];

    const memberIds = new Set(activeMembers.map((member) => member.id));
    let ratingByMemberId = new Map(
      activeMembers.map((member) => [member.id, 1000]),
    );
    const movements: RankingMovementToPersist[] = [];
    const matchParticipations: MatchParticipation[] = [];

    for (const match of matches) {
      const beforeRanking = this.buildRankingState(ratingByMemberId);
      const nextRatingByMemberId = new Map(ratingByMemberId);
      const participatingMemberIds = new Set<string>();

      for (const player of match.players) {
        if (!memberIds.has(player.groupMemberId)) {
          continue;
        }

        participatingMemberIds.add(player.groupMemberId);
        nextRatingByMemberId.set(player.groupMemberId, player.ratingAfter);
      }

      const afterRanking = this.buildRankingState(nextRatingByMemberId);
      movements.push(
        ...this.detectMatchMovements({
          groupId,
          match,
          participatingMemberIds,
          beforeRanking,
          afterRanking,
        }),
      );
      matchParticipations.push({
        matchId: match.id,
        participatingMemberIds,
      });
      ratingByMemberId = nextRatingByMemberId;
    }

    const finalRanking = this.buildRankingState(ratingByMemberId);
    const visibleMovementIds = this.getVisibleMovementIds(
      movements,
      matchParticipations,
      finalRanking,
    );

    this.logger.log(
      structuredLog('ranking_projection.movements_detected', {
        groupId,
        strategy: 'full_rebuild',
        matchesCount: matches.length,
        activeMembersCount: activeMembers.length,
        movementsDetected: movements.length,
        visibleMovements: visibleMovementIds.size,
        movements: movements.map((movement) => ({
          groupMemberId: movement.groupMemberId,
          matchId: movement.matchId,
          direction: movement.direction,
          positions: movement.positions,
          previousRank: movement.previousRank,
          currentRank: movement.currentRank,
          isVisible: visibleMovementIds.has(movement.id),
        })),
      }),
    );

    for (const movement of movements) {
      movement.isVisible = visibleMovementIds.has(movement.id);
      await this.upsertRankingMovement(tx, movement);
    }

    await this.updateCurrentRanks(tx, finalRanking);

    this.logger.log(
      structuredLog('ranking_projection.completed', {
        groupId,
        strategy: 'full_rebuild',
        activeMembersCount: activeMembers.length,
        matchesCount: matches.length,
        movementsDetected: movements.length,
        visibleMovements: visibleMovementIds.size,
        durationMs: Date.now() - startedAt,
      }),
    );
  }

  private async clearGroupRankingMovementState(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    await tx.rankingMovement.deleteMany({
      where: { groupId },
    });

    await tx.groupMember.updateMany({
      where: { groupId },
      data: { currentRank: null },
    });
  }

  private buildRankingState(ratingByMemberId: Map<string, number>) {
    const sortedMembers = [...ratingByMemberId.entries()]
      .map(([id, rating]) => ({ id, rating }))
      .sort((a, b) => {
        const ratingComparison = b.rating - a.rating;

        if (ratingComparison !== 0) {
          return ratingComparison;
        }

        return a.id.localeCompare(b.id);
      });
    const rankingByMemberId = new Map<string, RankingMemberState>();
    let currentRank = 0;
    let previousRating: number | null = null;

    for (const member of sortedMembers) {
      if (previousRating === null || member.rating !== previousRating) {
        currentRank += 1;
        previousRating = member.rating;
      }

      rankingByMemberId.set(member.id, {
        id: member.id,
        rating: member.rating,
        rank: currentRank,
      });
    }

    return rankingByMemberId;
  }

  private detectMatchMovements({
    groupId,
    match,
    participatingMemberIds,
    beforeRanking,
    afterRanking,
  }: {
    groupId: string;
    match: MatchForRanking;
    participatingMemberIds: Set<string>;
    beforeRanking: Map<string, RankingMemberState>;
    afterRanking: Map<string, RankingMemberState>;
  }) {
    const movements: RankingMovementToPersist[] = [];

    for (const groupMemberId of participatingMemberIds) {
      const before = beforeRanking.get(groupMemberId);
      const after = afterRanking.get(groupMemberId);

      if (!before || !after || before.rank === after.rank) {
        continue;
      }

      const direction: RankingDirection =
        after.rank < before.rank ? 'UP' : 'DOWN';

      movements.push({
        id: randomUUID(),
        groupId,
        groupMemberId,
        matchId: match.id,
        direction,
        positions: Math.abs(before.rank - after.rank),
        previousRank: before.rank,
        currentRank: after.rank,
        previousRating: before.rating,
        currentRating: after.rating,
        passedGroupMemberIds: this.getPassedGroupMemberIds({
          groupMemberId,
          direction,
          previousRank: before.rank,
          currentRank: after.rank,
          beforeRanking,
        }),
        occurredAt: match.playedAt,
        isVisible: false,
      });
    }

    return movements;
  }

  private getPassedGroupMemberIds({
    groupMemberId,
    direction,
    previousRank,
    currentRank,
    beforeRanking,
  }: {
    groupMemberId: string;
    direction: RankingDirection;
    previousRank: number;
    currentRank: number;
    beforeRanking: Map<string, RankingMemberState>;
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
      .map((member) => member.id);
  }

  private getVisibleMovementIds(
    movements: RankingMovementToPersist[],
    matchParticipations: MatchParticipation[],
    finalRanking: Map<string, RankingMemberState>,
  ) {
    const latestVisibleMovementByMemberId = new Map<
      string,
      RankingMovementToPersist
    >();
    const movementsByMatchId = new Map<string, RankingMovementToPersist[]>();

    for (const movement of movements) {
      const matchMovements = movementsByMatchId.get(movement.matchId) ?? [];
      matchMovements.push(movement);
      movementsByMatchId.set(movement.matchId, matchMovements);
    }

    for (const participation of matchParticipations) {
      for (const groupMemberId of participation.participatingMemberIds) {
        latestVisibleMovementByMemberId.delete(groupMemberId);
      }

      for (const movement of movementsByMatchId.get(participation.matchId) ??
        []) {
        const finalMemberRank = finalRanking.get(movement.groupMemberId)?.rank;

        if (finalMemberRank === movement.currentRank) {
          latestVisibleMovementByMemberId.set(movement.groupMemberId, movement);
        }
      }
    }

    return new Set(
      [...latestVisibleMovementByMemberId.values()].map(
        (movement) => movement.id,
      ),
    );
  }

  private async invalidateVisibleMovementsChangedByRanking(
    tx: Prisma.TransactionClient,
    groupId: string,
    finalRanking: Map<string, RankingMemberState>,
  ) {
    for (const member of finalRanking.values()) {
      await tx.rankingMovement.updateMany({
        where: {
          groupId,
          groupMemberId: member.id,
          isVisible: true,
          invalidatedAt: null,
          currentRank: { not: member.rank },
        },
        data: {
          isVisible: false,
          invalidatedAt: new Date(),
        },
      });
    }
  }

  private async invalidateVisibleMovementsForParticipants(
    tx: Prisma.TransactionClient,
    groupId: string,
    participatingMemberIds: Set<string>,
  ) {
    if (participatingMemberIds.size === 0) {
      return;
    }

    await tx.rankingMovement.updateMany({
      where: {
        groupId,
        groupMemberId: { in: [...participatingMemberIds] },
        isVisible: true,
        invalidatedAt: null,
      },
      data: {
        isVisible: false,
        invalidatedAt: new Date(),
      },
    });
  }

  private async updateCurrentRanks(
    tx: Prisma.TransactionClient,
    ranking: Map<string, RankingMemberState>,
  ) {
    for (const member of ranking.values()) {
      await this.updateCurrentRank(tx, member.id, member.rank);
    }
  }

  private async updateCurrentRank(
    tx: Prisma.TransactionClient,
    groupMemberId: string,
    currentRank: number,
  ) {
    await tx.groupMember.update({
      where: { id: groupMemberId },
      data: { currentRank },
    });
  }

  private async upsertRankingMovement(
    tx: Prisma.TransactionClient,
    movement: RankingMovementToPersist,
  ) {
    await tx.rankingMovement.upsert({
      where: {
        matchId_groupMemberId: {
          matchId: movement.matchId,
          groupMemberId: movement.groupMemberId,
        },
      },
      create: {
        id: movement.id,
        groupId: movement.groupId,
        groupMemberId: movement.groupMemberId,
        matchId: movement.matchId,
        direction: movement.direction,
        positions: movement.positions,
        previousRank: movement.previousRank,
        currentRank: movement.currentRank,
        previousRating: movement.previousRating,
        currentRating: movement.currentRating,
        passedGroupMemberIds: movement.passedGroupMemberIds,
        isVisible: movement.isVisible,
        invalidatedAt: movement.isVisible ? null : new Date(),
        occurredAt: movement.occurredAt,
      },
      update: {
        direction: movement.direction,
        positions: movement.positions,
        previousRank: movement.previousRank,
        currentRank: movement.currentRank,
        previousRating: movement.previousRating,
        currentRating: movement.currentRating,
        passedGroupMemberIds: movement.passedGroupMemberIds,
        isVisible: movement.isVisible,
        invalidatedAt: movement.isVisible ? null : new Date(),
        occurredAt: movement.occurredAt,
      },
    });
  }

  private logDetectedMovements({
    groupId,
    matchId,
    strategy,
    movements,
    participatingMemberIds,
  }: {
    groupId: string;
    matchId: string;
    strategy: 'incremental';
    movements: RankingMovementToPersist[];
    participatingMemberIds: Set<string>;
  }) {
    this.logger.log(
      structuredLog('ranking_projection.movements_detected', {
        groupId,
        matchId,
        strategy,
        participatingMembersCount: participatingMemberIds.size,
        movementsDetected: movements.length,
        visibleMovements: movements.length,
        movements: movements.map((movement) => ({
          groupMemberId: movement.groupMemberId,
          matchId: movement.matchId,
          direction: movement.direction,
          positions: movement.positions,
          previousRank: movement.previousRank,
          currentRank: movement.currentRank,
          isVisible: true,
        })),
      }),
    );
  }
}
