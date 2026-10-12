-- CreateEnum
CREATE TYPE "HighlightType" AS ENUM ('WIN_STREAK_CURRENT', 'WIN_STREAK_RECORD', 'CLIMB', 'LEADERSHIP', 'MILESTONE_MATCHES', 'MILESTONE_WINS');

-- AlterTable
ALTER TABLE "GroupHomeSummary" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GroupMemberStats" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "GroupRankingProjection" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MatchRankingSnapshot" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PlatformTrendingPlayer" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProcessingJob" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RankingMovement" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "GroupHighlight" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupMemberId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "HighlightType" NOT NULL,
    "value" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "anchorAt" TIMESTAMP(3) NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'WEEKLY_HIGHLIGHTS_V1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupHighlight_groupId_anchorAt_idx" ON "GroupHighlight"("groupId", "anchorAt");

-- CreateIndex
CREATE INDEX "GroupHighlight_score_idx" ON "GroupHighlight"("score");

-- CreateIndex
CREATE INDEX "GroupHighlight_userId_anchorAt_idx" ON "GroupHighlight"("userId", "anchorAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroupHighlight_groupMemberId_type_key" ON "GroupHighlight"("groupMemberId", "type");

-- RenameForeignKey
ALTER TABLE "PlatformTrendingPlayer" RENAME CONSTRAINT "PlatformTrendingPlayer_highlightGroupMemberId_highlightGroupId_" TO "PlatformTrendingPlayer_highlightGroupMemberId_highlightGro_fkey";

-- AddForeignKey
ALTER TABLE "GroupHighlight" ADD CONSTRAINT "GroupHighlight_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupHighlight" ADD CONSTRAINT "GroupHighlight_groupMemberId_groupId_fkey" FOREIGN KEY ("groupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupHighlight" ADD CONSTRAINT "GroupHighlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PlatformTrendingPlayer_highlightGroupMemberId_highlightGroupId_" RENAME TO "PlatformTrendingPlayer_highlightGroupMemberId_highlightGrou_idx";
