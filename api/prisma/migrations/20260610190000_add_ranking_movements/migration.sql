-- CreateEnum
CREATE TYPE "RankingMovementDirection" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN "currentRank" INTEGER;

-- CreateTable
CREATE TABLE "RankingMovement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupMemberId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "direction" "RankingMovementDirection" NOT NULL,
    "positions" INTEGER NOT NULL,
    "previousRank" INTEGER NOT NULL,
    "currentRank" INTEGER NOT NULL,
    "previousRating" DOUBLE PRECISION NOT NULL,
    "currentRating" DOUBLE PRECISION NOT NULL,
    "passedGroupMemberIds" JSONB NOT NULL DEFAULT '[]',
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingMovement_pkey" PRIMARY KEY ("id")
);

-- Backfill current active ranks from current ratings.
WITH ranked_members AS (
    SELECT
        "id",
        DENSE_RANK() OVER (PARTITION BY "groupId" ORDER BY "rating" DESC)::INTEGER AS "rank"
    FROM "GroupMember"
    WHERE "leftAt" IS NULL
)
UPDATE "GroupMember"
SET "currentRank" = ranked_members."rank"
FROM ranked_members
WHERE "GroupMember"."id" = ranked_members."id";

-- CreateIndex
CREATE INDEX "GroupMember_groupId_currentRank_rating_idx" ON "GroupMember"("groupId", "currentRank", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "RankingMovement_matchId_groupMemberId_key" ON "RankingMovement"("matchId", "groupMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingMovement_visible_groupMemberId_key" ON "RankingMovement"("groupMemberId") WHERE "isVisible" = true AND "invalidatedAt" IS NULL;

-- CreateIndex
CREATE INDEX "RankingMovement_groupId_occurredAt_idx" ON "RankingMovement"("groupId", "occurredAt");

-- CreateIndex
CREATE INDEX "RankingMovement_groupMemberId_occurredAt_idx" ON "RankingMovement"("groupMemberId", "occurredAt");

-- CreateIndex
CREATE INDEX "RankingMovement_matchId_idx" ON "RankingMovement"("matchId");

-- CreateIndex
CREATE INDEX "RankingMovement_groupId_isVisible_idx" ON "RankingMovement"("groupId", "isVisible");

-- AddForeignKey
ALTER TABLE "RankingMovement" ADD CONSTRAINT "RankingMovement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingMovement" ADD CONSTRAINT "RankingMovement_groupMemberId_groupId_fkey" FOREIGN KEY ("groupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingMovement" ADD CONSTRAINT "RankingMovement_matchId_groupId_fkey" FOREIGN KEY ("matchId", "groupId") REFERENCES "Match"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;
