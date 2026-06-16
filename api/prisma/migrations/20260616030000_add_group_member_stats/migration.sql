CREATE TABLE "GroupMemberStats" (
  "groupMemberId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "matchesCount" INTEGER NOT NULL DEFAULT 0,
  "winsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GroupMemberStats_pkey" PRIMARY KEY ("groupMemberId"),
  CONSTRAINT "GroupMemberStats_groupMemberId_groupId_key" UNIQUE ("groupMemberId", "groupId")
);

CREATE INDEX "GroupMemberStats_groupId_idx" ON "GroupMemberStats"("groupId");
CREATE INDEX "GroupMemberStats_groupId_matchesCount_idx" ON "GroupMemberStats"("groupId", "matchesCount");

ALTER TABLE "GroupMemberStats"
  ADD CONSTRAINT "GroupMemberStats_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMemberStats"
  ADD CONSTRAINT "GroupMemberStats_groupMemberId_groupId_fkey"
  FOREIGN KEY ("groupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "GroupMemberStats" (
  "groupMemberId",
  "groupId",
  "matchesCount",
  "winsCount",
  "createdAt",
  "updatedAt"
)
SELECT
  gm."id",
  gm."groupId",
  COUNT(m."id")::int AS "matchesCount",
  COALESCE(
    SUM(
      CASE
        WHEN m."id" IS NOT NULL AND mp."team" = m."winnerTeam" THEN 1
        ELSE 0
      END
    ),
    0
  )::int AS "winsCount",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "GroupMember" gm
LEFT JOIN "MatchPlayer" mp
  ON mp."groupMemberId" = gm."id"
  AND mp."groupId" = gm."groupId"
LEFT JOIN "Match" m
  ON m."id" = mp."matchId"
  AND m."groupId" = mp."groupId"
  AND m."deletedAt" IS NULL
WHERE gm."leftAt" IS NULL
GROUP BY gm."id", gm."groupId"
ON CONFLICT ("groupMemberId") DO NOTHING;
