-- AddEnumValue
ALTER TYPE "ProcessingJobType"
ADD VALUE 'PLATFORM_TRENDING_PLAYERS_REBUILD';

-- Drop old scope constraint before making groupId nullable.
ALTER TABLE "ProcessingJob"
DROP CONSTRAINT "ProcessingJob_group_scope_requires_group_check";

-- Drop foreign keys that depend on groupId before altering nullability.
ALTER TABLE "ProcessingJob"
DROP CONSTRAINT "ProcessingJob_matchId_groupId_fkey";

ALTER TABLE "ProcessingJob"
DROP CONSTRAINT "ProcessingJob_groupId_fkey";

-- Permit platform jobs without group context.
ALTER TABLE "ProcessingJob"
ALTER COLUMN "groupId" DROP NOT NULL;

-- Restore foreign keys. Nullable groupId remains valid for platform jobs.
ALTER TABLE "ProcessingJob"
ADD CONSTRAINT "ProcessingJob_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProcessingJob"
ADD CONSTRAINT "ProcessingJob_matchId_groupId_fkey"
FOREIGN KEY ("matchId", "groupId") REFERENCES "Match"("id", "groupId")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep scope invariants explicit at the database boundary.
ALTER TABLE "ProcessingJob"
ADD CONSTRAINT "ProcessingJob_scope_payload_shape_check"
CHECK (
  (
    "scope" = 'GROUP'
    AND "groupId" IS NOT NULL
  )
  OR
  (
    "scope" = 'PLATFORM'
    AND "groupId" IS NULL
    AND "matchId" IS NULL
    AND "type"::text = 'PLATFORM_TRENDING_PLAYERS_REBUILD'
  )
);
