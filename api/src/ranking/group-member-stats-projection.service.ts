import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { structuredLog } from '../observability/structured-log';

type GroupMemberStatsProjectionRow = {
  activeMembersCount: number;
  activeMatchesCount: number;
  upsertedCount: number;
  deletedCount: number;
  projectedMatchesCount: number;
  projectedWinsCount: number;
};

@Injectable()
export class GroupMemberStatsProjectionService {
  private readonly logger = new Logger(GroupMemberStatsProjectionService.name);

  async syncGroupMemberStats(tx: Prisma.TransactionClient, groupId: string) {
    const startedAt = Date.now();
    const [summary] = await tx.$queryRaw<GroupMemberStatsProjectionRow[]>`
      WITH active_members AS (
        SELECT
          gm."id" AS "groupMemberId",
          gm."groupId" AS "groupId"
        FROM "GroupMember" gm
        WHERE gm."groupId" = ${groupId}
          AND gm."leftAt" IS NULL
      ),
      member_stats AS (
        SELECT
          am."groupMemberId",
          am."groupId",
          COUNT(m."id")::int AS "matchesCount",
          COALESCE(
            SUM(
              CASE
                WHEN m."id" IS NOT NULL AND mp."team" = m."winnerTeam" THEN 1
                ELSE 0
              END
            ),
            0
          )::int AS "winsCount"
        FROM active_members am
        LEFT JOIN "MatchPlayer" mp
          ON mp."groupMemberId" = am."groupMemberId"
          AND mp."groupId" = am."groupId"
        LEFT JOIN "Match" m
          ON m."id" = mp."matchId"
          AND m."groupId" = mp."groupId"
          AND m."deletedAt" IS NULL
        GROUP BY am."groupMemberId", am."groupId"
      ),
      upserted AS (
        INSERT INTO "GroupMemberStats" (
          "groupMemberId",
          "groupId",
          "matchesCount",
          "winsCount",
          "createdAt",
          "updatedAt"
        )
        SELECT
          ms."groupMemberId",
          ms."groupId",
          ms."matchesCount",
          ms."winsCount",
          NOW(),
          NOW()
        FROM member_stats ms
        ON CONFLICT ("groupMemberId") DO UPDATE SET
          "groupId" = EXCLUDED."groupId",
          "matchesCount" = EXCLUDED."matchesCount",
          "winsCount" = EXCLUDED."winsCount",
          "updatedAt" = NOW()
        RETURNING "groupMemberId", "matchesCount", "winsCount"
      ),
      deleted AS (
        DELETE FROM "GroupMemberStats" gms
        WHERE gms."groupId" = ${groupId}
          AND NOT EXISTS (
            SELECT 1
            FROM active_members am
            WHERE am."groupMemberId" = gms."groupMemberId"
          )
        RETURNING gms."groupMemberId"
      )
      SELECT
        (SELECT COUNT(*)::int FROM active_members) AS "activeMembersCount",
        (
          SELECT COUNT(*)::int
          FROM "Match" m
          WHERE m."groupId" = ${groupId}
            AND m."deletedAt" IS NULL
        ) AS "activeMatchesCount",
        (SELECT COUNT(*)::int FROM upserted) AS "upsertedCount",
        (SELECT COUNT(*)::int FROM deleted) AS "deletedCount",
        COALESCE((SELECT SUM("matchesCount")::int FROM upserted), 0) AS "projectedMatchesCount",
        COALESCE((SELECT SUM("winsCount")::int FROM upserted), 0) AS "projectedWinsCount"
    `;

    this.logger.log(
      structuredLog('group_member_stats_projection.completed', {
        groupId,
        activeMembersCount: summary?.activeMembersCount ?? 0,
        activeMatchesCount: summary?.activeMatchesCount ?? 0,
        upsertedCount: summary?.upsertedCount ?? 0,
        deletedCount: summary?.deletedCount ?? 0,
        projectedMatchesCount: summary?.projectedMatchesCount ?? 0,
        projectedWinsCount: summary?.projectedWinsCount ?? 0,
        durationMs: Date.now() - startedAt,
      }),
    );

    return summary;
  }
}
