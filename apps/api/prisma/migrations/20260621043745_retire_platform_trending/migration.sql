-- Retire the platform-trending read model.
--
-- The now-unused ProcessingJob enum values (PLATFORM scope, PLATFORM_TRENDING_PLAYERS_REBUILD
-- type) are intentionally kept: removing an enum value in Postgres requires a fragile type swap
-- that is risky against a live database. Deprecating them in place keeps this migration a plain,
-- always-safe DROP TABLE that applies cleanly anywhere with no manual steps.

-- DropForeignKey
ALTER TABLE "PlatformTrendingPlayer" DROP CONSTRAINT "PlatformTrendingPlayer_highlightGroupId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformTrendingPlayer" DROP CONSTRAINT "PlatformTrendingPlayer_highlightGroupMemberId_highlightGro_fkey";

-- DropForeignKey
ALTER TABLE "PlatformTrendingPlayer" DROP CONSTRAINT "PlatformTrendingPlayer_userId_fkey";

-- DropTable
DROP TABLE "PlatformTrendingPlayer";
