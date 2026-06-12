-- CreateEnum
CREATE TYPE "GroupRankingProjectionStatus" AS ENUM ('CURRENT', 'PROCESSING', 'FAILED');

-- AlterTable
ALTER TABLE "MatchPlayer"
  ADD COLUMN "rankBefore" INTEGER,
  ADD COLUMN "rankAfter" INTEGER,
  ADD COLUMN "rankDelta" INTEGER,
  ADD COLUMN "movementDirection" "RankingMovementDirection",
  ADD COLUMN "movementPositions" INTEGER;

-- CreateTable
CREATE TABLE "MatchRankingSnapshot" (
  "matchId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "previousLeaders" JSONB NOT NULL DEFAULT '[]',
  "currentLeaders" JSONB NOT NULL DEFAULT '[]',
  "dethronedLeaders" JSONB NOT NULL DEFAULT '[]',
  "movements" JSONB NOT NULL DEFAULT '[]',
  "algorithmVersion" TEXT NOT NULL DEFAULT 'BEACH_ELO_V1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MatchRankingSnapshot_pkey" PRIMARY KEY ("matchId")
);

-- CreateTable
CREATE TABLE "GroupRankingProjection" (
  "groupId" TEXT NOT NULL,
  "status" "GroupRankingProjectionStatus" NOT NULL DEFAULT 'CURRENT',
  "version" INTEGER NOT NULL DEFAULT 0,
  "processingJobId" TEXT,
  "lastProcessedMatchId" TEXT,
  "lastProcessedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GroupRankingProjection_pkey" PRIMARY KEY ("groupId")
);

-- CreateIndex
CREATE INDEX "MatchPlayer_groupId_rankBefore_rankAfter_idx" ON "MatchPlayer"("groupId", "rankBefore", "rankAfter");

-- CreateIndex
CREATE INDEX "MatchRankingSnapshot_groupId_idx" ON "MatchRankingSnapshot"("groupId");

-- CreateIndex
CREATE INDEX "MatchRankingSnapshot_algorithmVersion_idx" ON "MatchRankingSnapshot"("algorithmVersion");

-- CreateIndex
CREATE INDEX "GroupRankingProjection_status_idx" ON "GroupRankingProjection"("status");

-- CreateIndex
CREATE INDEX "GroupRankingProjection_lastProcessedAt_idx" ON "GroupRankingProjection"("lastProcessedAt");

-- AddForeignKey
ALTER TABLE "MatchRankingSnapshot"
  ADD CONSTRAINT "MatchRankingSnapshot_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRankingSnapshot"
  ADD CONSTRAINT "MatchRankingSnapshot_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRankingProjection"
  ADD CONSTRAINT "GroupRankingProjection_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill projection rows for existing groups.
INSERT INTO "GroupRankingProjection" ("groupId", "status", "version", "lastProcessedAt", "createdAt", "updatedAt")
SELECT "id", 'CURRENT', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Group"
ON CONFLICT ("groupId") DO NOTHING;
