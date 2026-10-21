import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  RankingEntryResponse,
  RankingMovementResponse,
} from '@arena/contracts/ranking';
import { MEMBER_USER_SELECT } from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';

const EMPTY_GROUP_MEMBER_STATS = {
  matchesCount: 0,
  winsCount: 0,
};

// The movement plus the member it belongs to; the id keys the lookup and stays
// off the wire (the entry it hangs on carries it).
type VisibleRankingMovementRow = RankingMovementResponse & {
  groupMemberId: string;
};

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(groupId: string): Promise<RankingEntryResponse[]> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const rankingMovementByMemberId =
      await this.findVisibleRankingMovements(groupId);
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
        currentRank: true,
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

  private async findVisibleRankingMovements(
    groupId: string,
  ): Promise<Map<string, RankingMovementResponse>> {
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

    return new Map(
      rows.map(({ groupMemberId, ...movement }) => [groupMemberId, movement]),
    );
  }
}
