-- One-time backfill of GroupMemberPartnerStats from existing matches, so the profile
-- screen's "melhor dupla" / "suas duplas" show data without logging a new match per
-- group. Mirrors group-member-partner-stats-projection.service.ts, but across all
-- groups at once and without the prune/DELETE arm. Idempotent via ON CONFLICT; future
-- matches keep using the projection.

WITH active_members AS (
  SELECT gm."id" AS "groupMemberId"
  FROM "GroupMember" gm
  WHERE gm."leftAt" IS NULL
),
-- One directional row per (player, teammate) pairing per match: self-join the two
-- players on the same team. <> guards the (impossible) self-pairing.
pairings AS (
  SELECT
    mp1."groupMemberId" AS "groupMemberId",
    mp2."groupMemberId" AS "partnerMemberId",
    mp1."groupId"       AS "groupId",
    (m."winnerTeam" IS NOT NULL AND mp1."team" = m."winnerTeam") AS "isWin"
  FROM "MatchPlayer" mp1
  INNER JOIN "MatchPlayer" mp2
    ON mp2."matchId" = mp1."matchId"
    AND mp2."groupId" = mp1."groupId"
    AND mp2."team" = mp1."team"
    AND mp2."groupMemberId" <> mp1."groupMemberId"
  INNER JOIN "Match" m
    ON m."id" = mp1."matchId"
    AND m."groupId" = mp1."groupId"
    AND m."deletedAt" IS NULL
  WHERE mp1."groupMemberId" IN (SELECT "groupMemberId" FROM active_members)
    AND mp2."groupMemberId" IN (SELECT "groupMemberId" FROM active_members)
),
partner_stats AS (
  SELECT
    p."groupMemberId",
    p."partnerMemberId",
    p."groupId",
    COUNT(*)::int AS "matchesTogether",
    COALESCE(SUM(CASE WHEN p."isWin" THEN 1 ELSE 0 END), 0)::int AS "winsTogether"
  FROM pairings p
  GROUP BY p."groupMemberId", p."partnerMemberId", p."groupId"
)
INSERT INTO "GroupMemberPartnerStats" (
  "id",
  "groupId",
  "groupMemberId",
  "partnerMemberId",
  "matchesTogether",
  "winsTogether",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  ps."groupId",
  ps."groupMemberId",
  ps."partnerMemberId",
  ps."matchesTogether",
  ps."winsTogether",
  NOW(),
  NOW()
FROM partner_stats ps
ON CONFLICT ("groupMemberId", "partnerMemberId") DO UPDATE SET
  "groupId"         = EXCLUDED."groupId",
  "matchesTogether" = EXCLUDED."matchesTogether",
  "winsTogether"    = EXCLUDED."winsTogether",
  "updatedAt"       = NOW();
