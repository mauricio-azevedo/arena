import { MEMBER_USER_SELECT } from '../common/member-display-name';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EMPTY_GROUP_MEMBER_STATS = {
  matchesCount: 0,
  winsCount: 0,
};

type RankingMovementDirection = 'UP' | 'DOWN';

type VisibleRankingMovementRow = {
  groupMemberId: string;
  direction: RankingMovementDirection;
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  sourceMatchId: string;
  occurredAt: Date;
};

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const rankingMovements = await this.findVisibleRankingMovements(groupId);
    const rankingMovementByMemberId = new Map(
      rankingMovements.map((movement) => [movement.groupMemberId, movement]),
    );
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        leftAt: null,
      },
      orderBy: [
        { rating: 'desc' },
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
      select: {
        id: true,
        groupId: true,
        rating: true,
        ratingDeviation: true,
        ratingVolatility: true,
        ratingMu: true,
        ratingSigma: true,
        ratingAlgorithm: true,
        role: true,
        userId: true,
        displayName: true,
        leftAt: true,
        createdAt: true,
        updatedAt: true,
        stats: {
          select: {
            matchesCount: true,
            winsCount: true,
          },
        },
        user: {
          select: {
            id: true,
            ...MEMBER_USER_SELECT,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return members.map((member) => ({
      ...member,
      stats: member.stats ?? EMPTY_GROUP_MEMBER_STATS,
      rankingMovement: rankingMovementByMemberId.get(member.id) ?? null,
    }));
  }

  private async findVisibleRankingMovements(groupId: string) {
    const rows = await this.prisma.$queryRaw<VisibleRankingMovementRow[]>`
      SELECT
        "groupMemberId",
        "direction",
        "positions",
        "previousRank",
        "currentRank",
        "previousRating",
        "currentRating",
        "matchId" AS "sourceMatchId",
        "occurredAt"
      FROM "RankingMovement"
      WHERE "groupId" = ${groupId}
        AND "isVisible" = true
        AND "invalidatedAt" IS NULL
    `;

    return rows.map((row) => ({
      groupMemberId: row.groupMemberId,
      direction: row.direction,
      positions: row.positions,
      previousRank: row.previousRank,
      currentRank: row.currentRank,
      previousRating: row.previousRating,
      currentRating: row.currentRating,
      sourceMatchId: row.sourceMatchId,
      occurredAt: row.occurredAt,
    }));
  }
}
