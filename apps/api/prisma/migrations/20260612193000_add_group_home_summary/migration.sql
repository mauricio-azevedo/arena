CREATE TABLE "GroupHomeSummary" (
  "groupId" TEXT NOT NULL,
  "membersCount" INTEGER NOT NULL DEFAULT 0,
  "leaders" JSONB NOT NULL DEFAULT '[]',
  "lastRelevantFeedItemId" TEXT,
  "lastRelevantAt" TIMESTAMP(3),
  "projectionStatus" "GroupRankingProjectionStatus",
  "lastProcessedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GroupHomeSummary_pkey" PRIMARY KEY ("groupId")
);

CREATE INDEX "GroupHomeSummary_lastRelevantAt_idx" ON "GroupHomeSummary"("lastRelevantAt");
CREATE INDEX "GroupHomeSummary_projectionStatus_idx" ON "GroupHomeSummary"("projectionStatus");

ALTER TABLE "GroupHomeSummary"
  ADD CONSTRAINT "GroupHomeSummary_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupHomeSummary"
  ADD CONSTRAINT "GroupHomeSummary_lastRelevantFeedItemId_fkey"
  FOREIGN KEY ("lastRelevantFeedItemId") REFERENCES "FeedItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "GroupHomeSummary" (
  "groupId",
  "membersCount",
  "leaders",
  "lastRelevantFeedItemId",
  "lastRelevantAt",
  "projectionStatus",
  "lastProcessedAt",
  "lastError",
  "createdAt",
  "updatedAt"
)
SELECT
  g."id",
  COALESCE(m."membersCount", 0),
  COALESCE(l."leaders", '[]'::jsonb),
  f."id",
  f."occurredAt",
  p."status",
  p."lastProcessedAt",
  p."lastError",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Group" g
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS "membersCount"
  FROM "GroupMember" gm
  WHERE gm."groupId" = g."id"
    AND gm."leftAt" IS NULL
) m ON TRUE
LEFT JOIN LATERAL (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'groupMemberId', gm."id",
        'userId', gm."userId",
        'displayName', trim(concat(u."firstName", ' ', u."lastName")),
        'rating', gm."rating",
        'rank', gm."currentRank"
      )
      ORDER BY gm."rating" DESC, gm."id" ASC
    ),
    '[]'::jsonb
  ) AS "leaders"
  FROM "GroupMember" gm
  INNER JOIN "User" u ON u."id" = gm."userId"
  WHERE gm."groupId" = g."id"
    AND gm."leftAt" IS NULL
    AND gm."currentRank" = 1
) l ON TRUE
LEFT JOIN LATERAL (
  SELECT fi."id", fi."occurredAt"
  FROM "FeedItem" fi
  WHERE fi."groupId" = g."id"
    AND fi."type" NOT IN ('MEMBER_JOINED', 'GROUP_CREATED')
  ORDER BY fi."occurredAt" DESC, fi."createdAt" DESC
  LIMIT 1
) f ON TRUE
LEFT JOIN "GroupRankingProjection" p ON p."groupId" = g."id"
ON CONFLICT ("groupId") DO NOTHING;
