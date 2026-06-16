# Group member stats projection QA

This checklist validates the `GroupMemberStats` projection used by the group ranking API.

## Scope

The projection stores, per active group member:

- `matchesCount`: active matches where the member appears as a `MatchPlayer`;
- `winsCount`: active matches where the member's `MatchPlayer.team` equals `Match.winnerTeam`.

The projection intentionally does not persist `winRate`; consumers derive it from `winsCount / matchesCount`.

## Preconditions

Run these after applying the migration and regenerating the Prisma client:

```bash
cd api
npx prisma migrate dev
npx prisma generate
npm run build
```

Use a development group with at least four active members.

## Inspection queries

Use these queries only in local/dev databases.

### Projection rows

```sql
SELECT
  gms."groupMemberId",
  gms."groupId",
  gms."matchesCount",
  gms."winsCount",
  gms."updatedAt"
FROM "GroupMemberStats" gms
WHERE gms."groupId" = '<GROUP_ID>'
ORDER BY gms."matchesCount" DESC, gms."winsCount" DESC;
```

### Source-of-truth aggregate

```sql
SELECT
  gm."id" AS "groupMemberId",
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
  )::int AS "winsCount"
FROM "GroupMember" gm
LEFT JOIN "MatchPlayer" mp
  ON mp."groupMemberId" = gm."id"
  AND mp."groupId" = gm."groupId"
LEFT JOIN "Match" m
  ON m."id" = mp."matchId"
  AND m."groupId" = mp."groupId"
  AND m."deletedAt" IS NULL
WHERE gm."groupId" = '<GROUP_ID>'
  AND gm."leftAt" IS NULL
GROUP BY gm."id", gm."groupId"
ORDER BY "matchesCount" DESC, "winsCount" DESC;
```

The projection rows must match the source-of-truth aggregate.

## Manual regression scenarios

### 1. Empty active group

1. Create or select a group with active members and no active matches.
2. Trigger a `GROUP_RANKING_REBUILD` job.
3. Let the worker process it.
4. Check `GroupMemberStats`.

Expected:

- one stats row per active member;
- `matchesCount = 0`;
- `winsCount = 0`.

### 2. Create match with TEAM_A winner

1. Register a match with two players on `TEAM_A` and two players on `TEAM_B`.
2. Set `winnerTeam = TEAM_A` through normal match registration rules.
3. Let the processing job finish.
4. Check `GroupMemberStats`.

Expected:

- all four players have `matchesCount + 1`;
- the two `TEAM_A` players have `winsCount + 1`;
- the two `TEAM_B` players have unchanged `winsCount`.

### 3. Create match with TEAM_B winner

Repeat scenario 2 with `TEAM_B` as winner.

Expected:

- all four players have `matchesCount + 1`;
- the two `TEAM_B` players have `winsCount + 1`.

### 4. Update match winner

1. Start from a processed match where `TEAM_A` won.
2. Edit the match so `TEAM_B` wins.
3. Let the processing job finish.
4. Compare projection rows against the source-of-truth aggregate query.

Expected:

- participant `matchesCount` values remain unchanged;
- wins move from `TEAM_A` players to `TEAM_B` players;
- projection rows match the source-of-truth aggregate.

### 5. Update match participants

1. Start from a processed match.
2. Replace one participant through the normal edit flow.
3. Let the processing job finish.
4. Compare projection rows against the source-of-truth aggregate query.

Expected:

- removed participant loses the match participation and possible win;
- added participant gains the match participation and possible win;
- projection rows match the source-of-truth aggregate.

### 6. Soft-delete match

1. Delete a processed match through the normal flow.
2. Let the processing job finish.
3. Compare projection rows against the source-of-truth aggregate query.

Expected:

- deleted match no longer contributes to any `matchesCount` or `winsCount`;
- projection rows match the source-of-truth aggregate.

### 7. Rebuild idempotency

1. Trigger `GROUP_RANKING_REBUILD` twice for the same group without changing matches.
2. Let both jobs finish.
3. Compare `GroupMemberStats` after each rebuild.

Expected:

- second rebuild does not change counts;
- projection rows still match the source-of-truth aggregate.

### 8. Ranking API contract

Call:

```http
GET /groups/<GROUP_ID>/ranking
```

Expected for every ranking member:

```json
{
  "stats": {
    "matchesCount": 0,
    "winsCount": 0
  }
}
```

Counts should reflect the projection and should never require read-time aggregation over `MatchPlayer`.

## Notes

If any scenario fails, prefer fixing the projection rebuild path instead of adding incremental deltas. Create/update/delete of historical matches can affect older participants and winners; the projection must remain reconstructable from current active matches.
