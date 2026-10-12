-- CreateEnum
CREATE TYPE "MatchProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "Match"
  ADD COLUMN "processingStatus" "MatchProcessingStatus" NOT NULL DEFAULT 'PROCESSED',
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "processingError" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Backfill existing processed matches.
UPDATE "Match"
SET "processedAt" = COALESCE("updatedAt", "createdAt")
WHERE "processedAt" IS NULL;

-- CreateIndex
CREATE INDEX "Match_groupId_processingStatus_idx" ON "Match"("groupId", "processingStatus");

-- CreateIndex
CREATE INDEX "Match_groupId_deletedAt_idx" ON "Match"("groupId", "deletedAt");
