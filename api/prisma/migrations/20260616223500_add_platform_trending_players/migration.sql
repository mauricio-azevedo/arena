-- CreateTable
CREATE TABLE "PlatformTrendingPlayer" (
  "userId" TEXT NOT NULL,
  "trendRank" INTEGER NOT NULL,
  "displayName" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "recentMatches" INTEGER NOT NULL,
  "recentWins" INTEGER NOT NULL,
  "recentWinRate" DOUBLE PRECISION NOT NULL,
  "allTimeMatches" INTEGER NOT NULL,
  "allTimeWins" INTEGER NOT NULL,
  "allTimeWinRate" DOUBLE PRECISION NOT NULL,
  "highlightGroupId" TEXT,
  "highlightGroupName" TEXT,
  "highlightGroupMemberId" TEXT,
  "highlightGroupMembersCount" INTEGER,
  "highlightCurrentRank" INTEGER,
  "highlightRating" DOUBLE PRECISION,
  "windowDays" INTEGER NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "windowEndedAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlatformTrendingPlayer_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTrendingPlayer_trendRank_key" ON "PlatformTrendingPlayer"("trendRank");

-- CreateIndex
CREATE INDEX "PlatformTrendingPlayer_score_idx" ON "PlatformTrendingPlayer"("score");

-- CreateIndex
CREATE INDEX "PlatformTrendingPlayer_recentMatches_idx" ON "PlatformTrendingPlayer"("recentMatches");

-- CreateIndex
CREATE INDEX "PlatformTrendingPlayer_computedAt_idx" ON "PlatformTrendingPlayer"("computedAt");

-- AddForeignKey
ALTER TABLE "PlatformTrendingPlayer"
ADD CONSTRAINT "PlatformTrendingPlayer_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
