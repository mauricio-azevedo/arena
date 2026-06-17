import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { structuredLog } from '../observability/structured-log';

const DEFAULT_WINDOW_DAYS = 30;
const TRENDING_PLAYERS_LIMIT = 3;
const MIN_RECENT_MATCHES = 2;

type SyncPlatformTrendingPlayersOptions = {
  windowDays?: number;
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
    const minRecentMatches = options.minRecentMatches ?? MIN_RECENT_MATCHES;
    const windowEndedAt = options.now ?? new Date();
    const windowStartedAt = new Date(
      windowEndedAt.getTime() - windowDays * 24 * 60 * 60 * 1000,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.platformTrendingPlayer.deleteMany();
      const [summary] = await this.insertPlatformTrendingPlayers(tx, {
        windowDays,
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
          ${TRENDING_PLAYERS_LIMIT}::int AS "limit",
          ${input.minRecentMatches}::int AS "minRecentMatches",
          ${input.windowStartedAt}::timestamp AS "windowStartedAt",
          ${input.windowEndedAt}::timestamp AS "windowEndedAt",
          ${input.deletedCount}::int AS "deletedCount"
      ),
           player_match_stats AS (
             SELECT
               gm."userId",
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
             FROM "GroupMember" gm
                    INNER JOIN "MatchPlayer" mp
                               ON mp."groupMemberId" = gm."id"
                                 AND mp."groupId" = gm."groupId"
                    INNER JOIN "Match" m
                               ON m."id" = mp."matchId"
                                 AND m."groupId" = mp."groupId"
                                 AND m."deletedAt" IS NULL
                                 AND m."winnerTeam" IS NOT NULL
                    CROSS JOIN params p
             GROUP BY gm."userId"
           ),
           eligible_players AS (
             SELECT
               pms."userId",
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
      highlight_group_scores AS (
        SELECT
          gm."userId",
          gm."id" AS "groupMemberId",
          gm."groupId",
          gm."currentRank",
          COUNT(m."id")::int AS "recentMatchesInGroup",
          COUNT(m."id") FILTER (
            WHERE mp."team" = m."winnerTeam"
          )::int AS "recentWinsInGroup"
        FROM "GroupMember" gm
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
          AND gm."currentRank" IS NOT NULL
          AND m."playedAt" >= p."windowStartedAt"
          AND m."playedAt" < p."windowEndedAt"
        GROUP BY
          gm."userId",
          gm."id",
          gm."groupId",
          gm."currentRank"
      ),
      highlight_groups AS (
        SELECT
          hgs.*,
          ROW_NUMBER() OVER (
            PARTITION BY hgs."userId"
            ORDER BY
              hgs."currentRank" ASC,
              hgs."recentMatchesInGroup" DESC,
              hgs."recentWinsInGroup" DESC,
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
          ep."score",
          ep."recentMatches",
          ep."recentWins",
          ep."recentWinRate",
          ep."allTimeMatches",
          ep."allTimeWins",
          ep."allTimeWinRate",
          hg."groupId" AS "highlightGroupId",
          hg."groupMemberId" AS "highlightGroupMemberId"
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
          "score",
          "recentMatches",
          "recentWins",
          "recentWinRate",
          "allTimeMatches",
          "allTimeWins",
          "allTimeWinRate",
          "highlightGroupId",
          "highlightGroupMemberId",
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
          rp."score",
          rp."recentMatches",
          rp."recentWins",
          rp."recentWinRate",
          rp."allTimeMatches",
          rp."allTimeWins",
          rp."allTimeWinRate",
          rp."highlightGroupId",
          rp."highlightGroupMemberId",
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
