import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type LastRelevantFeedItem = {
  id: string;
  occurredAt: Date;
};

type ProjectionStatus = 'CURRENT' | 'PROCESSING' | 'FAILED';

type ProjectionState = {
  status: ProjectionStatus;
  lastProcessedAt: Date | null;
  lastError: string | null;
};

@Injectable()
export class GroupHomeSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async syncGroupSummary(groupId: string, tx?: PrismaClientLike) {
    const client = tx ?? this.prisma;
    const [membersCount, lastRelevantFeedItem, projection] = await Promise.all([
      this.countActiveMembers(client, groupId),
      this.findLastRelevantFeedItem(client, groupId),
      this.findProjection(client, groupId),
    ]);

    await this.upsertSummary(client, {
      groupId,
      membersCount,
      lastRelevantFeedItemId: lastRelevantFeedItem?.id ?? null,
      lastRelevantAt: lastRelevantFeedItem?.occurredAt ?? null,
      projectionStatus: projection?.status ?? null,
      lastProcessedAt: projection?.lastProcessedAt ?? null,
      lastError: projection?.lastError ?? null,
    });
  }

  private countActiveMembers(client: PrismaClientLike, groupId: string) {
    return client.groupMember.count({
      where: {
        groupId,
        leftAt: null,
      },
    });
  }

  private async findLastRelevantFeedItem(
    client: PrismaClientLike,
    groupId: string,
  ) {
    const items = await client.feedItem.findMany({
      where: {
        groupId,
        type: {
          notIn: ['MEMBER_JOINED', 'GROUP_CREATED'],
        },
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: 1,
      select: {
        id: true,
        occurredAt: true,
      },
    });

    return (items[0] ?? null) as LastRelevantFeedItem | null;
  }

  private async findProjection(client: PrismaClientLike, groupId: string) {
    const rows = await client.$queryRaw<ProjectionState[]>`
      SELECT "status", "lastProcessedAt", "lastError"
      FROM "GroupRankingProjection"
      WHERE "groupId" = ${groupId}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private async upsertSummary(
    client: PrismaClientLike,
    input: {
      groupId: string;
      membersCount: number;
      lastRelevantFeedItemId: string | null;
      lastRelevantAt: Date | null;
      projectionStatus: ProjectionStatus | null;
      lastProcessedAt: Date | null;
      lastError: string | null;
    },
  ) {
    await client.$executeRaw`
      INSERT INTO "GroupHomeSummary" (
        "groupId",
        "membersCount",
        "lastRelevantFeedItemId",
        "lastRelevantAt",
        "projectionStatus",
        "lastProcessedAt",
        "lastError",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${input.groupId},
        ${input.membersCount},
        ${input.lastRelevantFeedItemId},
        ${input.lastRelevantAt},
        ${input.projectionStatus}::"GroupRankingProjectionStatus",
        ${input.lastProcessedAt},
        ${input.lastError},
        NOW(),
        NOW()
      )
      ON CONFLICT ("groupId") DO UPDATE SET
        "membersCount" = EXCLUDED."membersCount",
        "lastRelevantFeedItemId" = EXCLUDED."lastRelevantFeedItemId",
        "lastRelevantAt" = EXCLUDED."lastRelevantAt",
        "projectionStatus" = EXCLUDED."projectionStatus",
        "lastProcessedAt" = EXCLUDED."lastProcessedAt",
        "lastError" = EXCLUDED."lastError",
        "updatedAt" = NOW()
    `;
  }
}
