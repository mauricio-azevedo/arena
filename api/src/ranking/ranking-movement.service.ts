import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MatchTeam } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';

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
    team: MatchTeam;
    position: number;
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

@Injectable()
export class RankingMovementService {
  async syncGroupRankingState(tx: Prisma.TransactionClient, groupId: string) {
    const activeMembers = await tx.groupMember.findMany({
      where: { groupId, leftAt: null },
      select: { id: true, rating: true },
    });

    await this.clearGroupRankingMovementState(tx, groupId);

    if (activeMembers.length === 0) {
      return;
    }

    const matches = await tx.match.findMany({
      where: { groupId },
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
    });

    const memberIds = new Set(activeMembers.map((member) => member.id));
    let ratingByMemberId = new Map(activeMembers.map((member) => [member.id, 1000]));
    const movements: RankingMovementToPersist[] = [];

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
      ratingByMemberId = nextRatingByMemberId;
    }

    const finalRanking = this.buildRankingState(ratingByMemberId);
    const visibleMovementIds = this.getVisibleMovementIds(movements, finalRanking);

    for (const movement of movements) {
      movement.isVisible = visibleMovementIds.has(movement.id);
      await this.createRankingMovement(tx, movement);
    }

    for (const member of finalRanking.values()) {
      await tx.groupMember.update({
        where: { id: member.id },
        data: { currentRank: member.rank },
      });
    }
  }

  private async clearGroupRankingMovementState(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    await tx.$executeRaw`
      DELETE FROM "RankingMovement"
      WHERE "groupId" = ${groupId}
    `;

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

      const direction: RankingDirection = after.rank < before.rank ? 'UP' : 'DOWN';

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
          before,
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
    before,
    beforeRanking,
  }: {
    groupMemberId: string;
    direction: RankingDirection;
    before: RankingMemberState;
    beforeRanking: Map<string, RankingMemberState>;
  }) {
    return [...beforeRanking.values()]
      .filter((member) => {
        if (member.id === groupMemberId) {
          return false;
        }

        if (direction === 'UP') {
          return member.rank < before.rank;
        }

        return member.rank > before.rank;
      })
      .map((member) => member.id);
  }

  private getVisibleMovementIds(
    movements: RankingMovementToPersist[],
    finalRanking: Map<string, RankingMemberState>,
  ) {
    const latestVisibleMovementByMemberId = new Map<string, RankingMovementToPersist>();

    for (const movement of movements) {
      const finalMemberRank = finalRanking.get(movement.groupMemberId)?.rank;

      if (finalMemberRank !== movement.currentRank) {
        latestVisibleMovementByMemberId.delete(movement.groupMemberId);
        continue;
      }

      latestVisibleMovementByMemberId.set(movement.groupMemberId, movement);
    }

    return new Set(
      [...latestVisibleMovementByMemberId.values()].map((movement) => movement.id),
    );
  }

  private async createRankingMovement(
    tx: Prisma.TransactionClient,
    movement: RankingMovementToPersist,
  ) {
    await tx.$executeRaw`
      INSERT INTO "RankingMovement" (
        "id",
        "groupId",
        "groupMemberId",
        "matchId",
        "direction",
        "positions",
        "previousRank",
        "currentRank",
        "previousRating",
        "currentRating",
        "passedGroupMemberIds",
        "isVisible",
        "occurredAt"
      ) VALUES (
        ${movement.id},
        ${movement.groupId},
        ${movement.groupMemberId},
        ${movement.matchId},
        ${movement.direction}::"RankingMovementDirection",
        ${movement.positions},
        ${movement.previousRank},
        ${movement.currentRank},
        ${movement.previousRating},
        ${movement.currentRating},
        ${JSON.stringify(movement.passedGroupMemberIds)}::jsonb,
        ${movement.isVisible},
        ${movement.occurredAt}
      )
    `;
  }
}
