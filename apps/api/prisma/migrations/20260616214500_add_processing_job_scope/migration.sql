-- CreateEnum
CREATE TYPE "ProcessingJobScope" AS ENUM ('GROUP', 'PLATFORM');

-- AlterTable
ALTER TABLE "ProcessingJob"
ADD COLUMN "scope" "ProcessingJobScope" NOT NULL DEFAULT 'GROUP',
ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE INDEX "ProcessingJob_scope_status_availableAt_idx" ON "ProcessingJob"("scope", "status", "availableAt");

-- CreateIndex
CREATE INDEX "ProcessingJob_dedupeKey_idx" ON "ProcessingJob"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_pending_dedupeKey_unique"
ON "ProcessingJob"("dedupeKey")
WHERE "dedupeKey" IS NOT NULL
  AND "status" = 'PENDING';

-- AddConstraint
ALTER TABLE "ProcessingJob"
ADD CONSTRAINT "ProcessingJob_group_scope_requires_group_check"
CHECK (
  "scope" = 'GROUP'
  AND "groupId" IS NOT NULL
);
