WITH ranked_live_dedupe_jobs AS (
    SELECT
        "id",
        "status",
        ROW_NUMBER() OVER (
      PARTITION BY "dedupeKey"
      ORDER BY
        CASE WHEN "status" = 'PROCESSING' THEN 0 ELSE 1 END,
        "availableAt" ASC,
        "createdAt" ASC,
        "id" ASC
    ) AS "dedupeRank"
    FROM "ProcessingJob"
    WHERE "dedupeKey" IS NOT NULL
      AND "status" IN ('PENDING', 'PROCESSING')
)
UPDATE "ProcessingJob"
SET
    "status" = 'DONE',
    "processedAt" = COALESCE("processedAt", NOW()),
    "lockedAt" = NULL,
    "lockedBy" = NULL,
    "lastError" = 'Deduped pending job before creating live dedupe unique index',
    "updatedAt" = NOW()
WHERE "id" IN (
    SELECT "id"
    FROM ranked_live_dedupe_jobs
    WHERE "dedupeRank" > 1
      AND "status" = 'PENDING'
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ProcessingJob"
    WHERE "dedupeKey" IS NOT NULL
      AND "status" IN ('PENDING', 'PROCESSING')
    GROUP BY "dedupeKey"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create ProcessingJob live dedupe index while duplicate live dedupe jobs exist';
END IF;
END $$;

DROP INDEX IF EXISTS "ProcessingJob_pending_dedupeKey_unique";

CREATE UNIQUE INDEX "ProcessingJob_dedupeKey_live_unique"
    ON "ProcessingJob" ("dedupeKey")
    WHERE "dedupeKey" IS NOT NULL
  AND "status" IN ('PENDING', 'PROCESSING');