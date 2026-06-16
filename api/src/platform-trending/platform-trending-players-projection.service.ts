import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { structuredLog } from '../observability/structured-log';

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_LIMIT = 20;
const MIN_RECENT_MATCHES = 2;

type SyncPlatformTrendingPlayersOptions = {
  windowDays?: number;
  limit?: number;
  minRecentMatches?: number;
  now?: Date;
};

type PlatformTrendingPlayersProjectionSummary = {
  eligiblePlayersCount: number;
  insertedCount: number;
  deletedCount: number;
  windowDays: number;
  windowStartedAt: Date;
  windowEndedAt: Date;
};

@Injectable()
export class PlatformTrendingPlayersProjectionService {
  private readonly logger = new Logger(
    PlatformTrendingPlayersProjectionService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async syncPlatformTrendingPlayers(
    options: SyncPlatformTrendingPlayersOptions = {},
  ) {
    const startedAt = Date.now();
    const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
    const limit = options.limit ?? DEFAULT_LIMIT;
    const minRecentMatches = options.minRecentMatches ?? MIN_RECENT_MATCHES;
    const windowEndedAt = options.now ?? new Date();
    const windowStartedAt = new Date(
      windowEndedAt.getTime() - windowDays * 24 * 60 * 60 * 1000,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.platformTrendingPlayer.deleteMany();
      const [summary] = await this.insertPlatformTrendingPlayers(tx, {
        windowDays,
        limit,
        minRecentMatches,
        windowStartedAt,
        windowEndedAt,
        deletedCount: deleted.count,
      });

      return (
        summary ?? {
          eligiblePlayersCount: 0,
          insertedCount: 0,
          deletedCount: deleted.count,
          windowDays,
          windowStartedAt,
          windowEndedAt,
        }
      );
    });

    this.logger.log(
      structuredLog('platform_trending_players_projection.completed', {
        eligiblePlayersCount: result.eligiblePlayersCount,
        insertedCount: result.insertedCount,
        deletedCount: result.deletedCount,
        windowDays: result.windowDays,
        windowStartedAt: result.windowStartedAt.toISOString(),
        windowEndedAt: result.windowEndedAt.toISOString(),
        durationMs: Date.now() - startedAt,
      }),
    );

    return result;
  }

  private insertPlatformTrendingPlayers(
    tx: Prisma.TransactionClient,
    input: {
      windowDays: number;
      limit: number;
      minRecentMatches: number;
      windowStartedAt: Date;
      windowEndedAt: Date;
      deletedCount: number;
    },
  ) {
    return tx.$queryRaw<PlatformTrendingPlayersProjectionSummary[]>`
      WITH params AS (
        SELECT
          ${input.windowDays}::int AS "windowDays",
          ${input.limit}::int AS "limit",
          ${input.minRecentMatches}::int AS "minRecentMatches",
          ${input.windowStartedAt}::timestamp AS "windowStartedAt",
          ${input.windowEndedAt}::timestamp AS "windowEndedAt",
          ${input.deletedCount}::int AS "deletedCount"
      ),
      player_match_stats AS (
        SELECT
          u."id" AS "userId",
          CONCAT_WS(' ', u."firstName", u."lastName") AS "displayName",
          COUNT(m."id") FILTER (
            WHERE m."playedAt" >= p."windowStartedAt"
              AND m."playedAt" < p."windowEndedAt"
          )::int AS "recentMatches",
          COUNT(m."id") FILTER (
            WHERE m."playedAt" >= p."windowStartedAt"
              AND m."playedAt" < p."windowEndedAt"
              AND mp."team" = m."winnerTeam"
          )::int AS "recentWins",
          COUNT(m."id")::int AS "allTimeMatches",
          COUNT(m."id") FILTER (
            WHERE mp."team" = m."winnerTeam"
          )::int AS "allTimeWins"
        FROM "User" u
        INNER JOIN "GroupMember" gm
          ON gm."userId" = u."id"
          AND gm."leftAt" IS NULL
        INNER JOIN "MatchPlayer" mp
          ON mp."groupMemberId" = gm."id"
          AND mp."groupId" = gm."groupId"
        INNER JOIN "Match" m
          ON m."id" = mp."matchId"
          AND m."groupId" = mp."groupId"
          AND m."deletedAt" IS NULL
          AND m."winnerTeam" IS NOT NULL
        CROSS JOIN params p
        GROUP BY u."id", u."firstName", u."lastName"
      ),
      eligible_players AS (
        SELECT
          pms."userId",
          pms."displayName",
          pms."recentMatches",
          pms."recentWins",
          CASE
            WHEN pms."recentMatches" = 0 THEN 0
            ELSE pms."recentWins"::double precision
              / pms."recentMatches"::double precision
          END AS "recentWinRate",
          pms."allTimeMatches",
          pms."allTimeWins",
          CASE
            WHEN pms."allTimeMatches" = 0 THEN 0
            ELSE pms."allTimeWins"::double precision
              / pms."allTimeMatches"::double precision
          END AS "allTimeWinRate",
          (
            pms."recentMatches" * 3
            + pms."recentWins" * 5
            + CASE
                WHEN pms."recentMatches" = 0 THEN 0
                ELSE pms."recentWins"::double precision
                  / pms."recentMatches"::double precision
              END * 10
            + LEAST(pms."allTimeMatches", 20) * 0.25
          )::double precision AS "score"
        FROM player_match_stats pms
        CROSS JOIN params p
        WHERE pms."recentMatches" >= p."minRecentMatches"
      ),
      active_group_counts AS (
        SELECT
          gm."groupId",
          COUNT(gm."id")::int AS "membersCount"
        FROM "GroupMember" gm
        WHERE gm."leftAt" IS NULL
        GROUP BY gm."groupId"
      ),
      highlight_group_scores AS (
        SELECT
          gm."userId",
          gm."id" AS "groupMemberId",
          gm."groupId",
          g."name" AS "groupName",
          agc."membersCount",
          gm."currentRank",
          gm."rating",
          COUNT(m."id") FILTER (
            WHERE m."playedAt" >= p."windowStartedAt"
              AND m."playedAt" < p."windowEndedAt"
          )::int AS "recentMatchesInGroup",
          COUNT(m."id") FILTER (
            WHERE m."playedAt" >= p."windowStartedAt"
              AND m."playedAt" < p."windowEndedAt"
              AND mp."team" = m."winnerTeam"
          )::int AS "recentWinsInGroup"
        FROM "GroupMember" gm
        INNER JOIN "Group" g
          ON g."id" = gm."groupId"
        LEFT JOIN active_group_counts agc
          ON agc."groupId" = gm."groupId"
        INNER JOIN "MatchPlayer" mp
          ON mp."groupMemberId" = gm."id"
          AND mp."groupId" = gm."groupId"
        INNER JOIN "Match" m
          ON m."id" = mp."matchId"
          AND m."groupId" = mp."groupId"
          AND m."deletedAt" IS NULL
          AND m."winnerTeam" IS NOT NULL
        CROSS JOIN params p
        WHERE gm."leftAt" IS NULL
        GROUP BY
          gm."userId",
          gm."id",
          gm."groupId",
          g."name",
          agc."membersCount",
          gm."currentRank",
          gm."rating"
      ),
      highlight_groups AS (
        SELECT
          hgs.*,
          ROW_NUMBER() OVER (
            PARTITION BY hgs."userId"
            ORDER BY
              hgs."recentMatchesInGroup" DESC,
              hgs."recentWinsInGroup" DESC,
              hgs."groupName" ASC,
              hgs."groupId" ASC
          ) AS "highlightRank"
        FROM highlight_group_scores hgs
      ),
      ranked_players AS (
        SELECT
          ep."userId",
          ROW_NUMBER() OVER (
            ORDER BY
              ep."score" DESC,
              ep."recentMatches" DESC,
              ep."recentWins" DESC,
              ep."userId" ASC
          )::int AS "trendRank",
          ep."displayName",
          ep."score",
          ep."recentMatches",
          ep."recentWins",
          ep."recentWinRate",
          ep."allTimeMatches",
          ep."allTimeWins",
          ep."allTimeWinRate",
          hg."groupId" AS "highlightGroupId",
          hg."groupName" AS "highlightGroupName",
          hg."groupMemberId" AS "highlightGroupMemberId",
          hg."membersCount" AS "highlightGroupMembersCount",
          hg."currentRank" AS "highlightCurrentRank",
          hg."rating" AS "highlightRating"
        FROM eligible_players ep
        LEFT JOIN highlight_groups hg
          ON hg."userId" = ep."userId"
          AND hg."highlightRank" = 1
        ORDER BY
          ep."score" DESC,
          ep."recentMatches" DESC,
          ep."recentWins" DESC,
          ep."userId" ASC
        LIMIT (SELECT "limit" FROM params)
      ),
      inserted AS (
        INSERT INTO "PlatformTrendingPlayer" (
          "userId",
          "trendRank",
          "displayName",
          "score",
          "recentMatches",
          "recentWins",
          "recentWinRate",
          "allTimeMatches",
          "allTimeWins",
          "allTimeWinRate",
          "highlightGroupId",
          "highlightGroupName",
          "highlightGroupMemberId",
          "highlightGroupMembersCount",
          "highlightCurrentRank",
          "highlightRating",
          "windowDays",
          "windowStartedAt",
          "windowEndedAt",
          "metadata",
          "computedAt",
          "createdAt",
          "updatedAt"
        )
        SELECT
          rp."userId",
          rp."trendRank",
          rp."displayName",
          rp."score",
          rp."recentMatches",
          rp."recentWins",
          rp."recentWinRate",
          rp."allTimeMatches",
          rp."allTimeWins",
          rp."allTimeWinRate",
          rp."highlightGroupId",
          rp."highlightGroupName",
          rp."highlightGroupMemberId",
          rp."highlightGroupMembersCount",
          rp."highlightCurrentRank",
          rp."highlightRating",
          (SELECT "windowDays" FROM params),
          (SELECT "windowStartedAt" FROM params),
          (SELECT "windowEndedAt" FROM params),
          JSONB_BUILD_OBJECT(
            'minRecentMatches', (SELECT "minRecentMatches" FROM params),
            'limit', (SELECT "limit" FROM params),
            'algorithmVersion', 'PLATFORM_TRENDING_PLAYERS_V1'
          ),
          NOW(),
          NOW(),
          NOW()
        FROM ranked_players rp
        RETURNING "userId"
      )
      SELECT
        (SELECT COUNT(*)::int FROM eligible_players)
          AS "eligiblePlayersCount",
        (SELECT COUNT(*)::int FROM inserted)
          AS "insertedCount",
        (SELECT "deletedCount" FROM params)
          AS "deletedCount",
        (SELECT "windowDays" FROM params)
          AS "windowDays",
        (SELECT "windowStartedAt" FROM params)
          AS "windowStartedAt",
        (SELECT "windowEndedAt" FROM params)
          AS "windowEndedAt"
    `;
  }
}
