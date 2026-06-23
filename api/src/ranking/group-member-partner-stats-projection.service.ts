import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { structuredLog } from '../observability/structured-log';

type GroupMemberPartnerStatsProjectionRow = {
  activeMembersCount: number;
  activeMatchesCount: number;
  upsertedCount: number;
  deletedCount: number;
  projectedPairingsCount: number;
  projectedWinsCount: number;
};

@Injectable()
export class GroupMemberPartnerStatsProjectionService {
  private readonly logger = new Logger(
    GroupMemberPartnerStatsProjectionService.name,
  );

  async syncGroupMemberPartnerStats(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    const startedAt = Date.now();
    const [summary] = await tx.$queryRaw<
      GroupMemberPartnerStatsProjectionRow[]
    >`
      WITH active_members AS (
        SELECT gm."id" AS "groupMemberId"
        FROM "GroupMember" gm
        WHERE gm."groupId" = ${groupId}
          AND gm."leftAt" IS NULL
      ),
      -- One directional row per (player, teammate) pairing per match: self-join the
      -- two players on the same team. A match has 2 players per team, so each player
      -- pairs with exactly one teammate; <> guards the (impossible) self-pairing.
      pairings AS (
        SELECT
          mp1."groupMemberId" AS "groupMemberId",
          mp2."groupMemberId" AS "partnerMemberId",
          mp1."groupId" AS "groupId",
          (m."winnerTeam" IS NOT NULL AND mp1."team" = m."winnerTeam") AS "isWin"
        FROM "MatchPlayer" mp1
        INNER JOIN "MatchPlayer" mp2
          ON mp2."matchId" = mp1."matchId"
          AND mp2."groupId" = mp1."groupId"
          AND mp2."team" = mp1."team"
          AND mp2."groupMemberId" <> mp1."groupMemberId"
        INNER JOIN "Match" m
          ON m."id" = mp1."matchId"
          AND m."groupId" = mp1."groupId"
          AND m."deletedAt" IS NULL
        WHERE mp1."groupId" = ${groupId}
          AND mp1."groupMemberId" IN (SELECT "groupMemberId" FROM active_members)
          AND mp2."groupMemberId" IN (SELECT "groupMemberId" FROM active_members)
      ),
      partner_stats AS (
        SELECT
          p."groupMemberId",
          p."partnerMemberId",
          p."groupId",
          COUNT(*)::int AS "matchesTogether",
          COALESCE(SUM(CASE WHEN p."isWin" THEN 1 ELSE 0 END), 0)::int AS "winsTogether"
        FROM pairings p
        GROUP BY p."groupMemberId", p."partnerMemberId", p."groupId"
      ),
      upserted AS (
        INSERT INTO "GroupMemberPartnerStats" (
          "id",
          "groupId",
          "groupMemberId",
          "partnerMemberId",
          "matchesTogether",
          "winsTogether",
          "createdAt",
          "updatedAt"
        )
        SELECT
          gen_random_uuid(),
          ps."groupId",
          ps."groupMemberId",
          ps."partnerMemberId",
          ps."matchesTogether",
          ps."winsTogether",
          NOW(),
          NOW()
        FROM partner_stats ps
        ON CONFLICT ("groupMemberId", "partnerMemberId") DO UPDATE SET
          "groupId" = EXCLUDED."groupId",
          "matchesTogether" = EXCLUDED."matchesTogether",
          "winsTogether" = EXCLUDED."winsTogether",
          "updatedAt" = NOW()
        RETURNING "groupMemberId", "matchesTogether", "winsTogether"
      ),
      deleted AS (
        DELETE FROM "GroupMemberPartnerStats" gmps
        WHERE gmps."groupId" = ${groupId}
          AND NOT EXISTS (
            SELECT 1
            FROM partner_stats ps
            WHERE ps."groupMemberId" = gmps."groupMemberId"
              AND ps."partnerMemberId" = gmps."partnerMemberId"
          )
        RETURNING gmps."id"
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
        COALESCE((SELECT SUM("matchesTogether")::int FROM upserted), 0) AS "projectedPairingsCount",
        COALESCE((SELECT SUM("winsTogether")::int FROM upserted), 0) AS "projectedWinsCount"
    `;

    this.logger.log(
      structuredLog('group_member_partner_stats_projection.completed', {
        groupId,
        activeMembersCount: summary?.activeMembersCount ?? 0,
        activeMatchesCount: summary?.activeMatchesCount ?? 0,
        upsertedCount: summary?.upsertedCount ?? 0,
        deletedCount: summary?.deletedCount ?? 0,
        projectedPairingsCount: summary?.projectedPairingsCount ?? 0,
        projectedWinsCount: summary?.projectedWinsCount ?? 0,
        durationMs: Date.now() - startedAt,
      }),
    );

    return summary;
  }
}
