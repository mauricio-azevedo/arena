-- CreateEnum
CREATE TYPE "ProcessingJobType" AS ENUM ('MATCH_CREATED', 'MATCH_UPDATED', 'MATCH_DELETED', 'GROUP_RANKING_REBUILD');

-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "type" "ProcessingJobType" NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'PENDING',
    "groupId" TEXT NOT NULL,
    "matchId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessingJob_status_availableAt_idx" ON "ProcessingJob"("status", "availableAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_groupId_status_createdAt_idx" ON "ProcessingJob"("groupId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_matchId_idx" ON "ProcessingJob"("matchId");

-- CreateIndex
CREATE INDEX "ProcessingJob_lockedBy_idx" ON "ProcessingJob"("lockedBy");

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_matchId_groupId_fkey" FOREIGN KEY ("matchId", "groupId") REFERENCES "Match"("id", "groupId") ON DELETE SET NULL ON UPDATE CASCADE;
