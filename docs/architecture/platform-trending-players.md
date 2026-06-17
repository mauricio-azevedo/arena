# Platform Trending Players

`PlatformTrendingPlayer` is a platform-level read model for the future "Jogadores em alta" surface.

This table is not a source of truth. It stores the expensive ranking and aggregate metrics needed by the platform trending surface.

## Source of truth

The source of truth remains:

- `Match`
- `MatchPlayer`
- `GroupMember`
- `Group`
- `User`

## Read model purpose

The read model keeps the future read path cheap. The UI should not compute platform-level trend rankings at request time.

Each projection run stores exactly the top 3 eligible platform-trending users for the selected window.

The read model should materialize expensive derived values:

- trend rank;
- trend score;
- recent match and win counts;
- recent win rate;
- all-time match and win counts;
- all-time win rate;
- highlighted group and group-member identifiers;
- projection window metadata.

It should not materialize cheap display data such as user display names or group names. The future read API should resolve those by joining from the stored identifiers.

## Current checkpoint

The table shape, migration, projection service, platform processing job, event-driven enqueue path, and scheduled rebuild enqueue path now exist.

The projection service is `PlatformTrendingPlayersProjectionService`.

It rebuilds `PlatformTrendingPlayer` from source-of-truth tables in one deterministic transaction:

- delete the previous read model rows;
- compute eligible players from match history;
- choose up to 3 ranked players;
- store metrics and identifiers needed by the read path;
- log projection metrics.

The processing job type is `PLATFORM_TRENDING_PLAYERS_REBUILD`.

It is a platform-scoped job:

- `scope` is `PLATFORM`;
- `groupId` is `NULL`;
- `matchId` is `NULL`;
- `dedupeKey` is `platform:trending-players:rebuild`.

`ProcessingJobRunnerService` dispatches that job to `PlatformTrendingPlayersProjectionService.syncPlatformTrendingPlayers()`.

The platform rebuild is enqueued after a group projection transaction finishes the source-of-truth-derived group state that platform trending depends on:

- group ratings;
- ranking movement state;
- group-member stats;
- feed projections;
- group home summary.

This ordering matters because the platform highlighted group uses current group ranking data.

`ProcessingJob` enforces one live job per `dedupeKey` with a partial unique index for jobs in `PENDING` or `PROCESSING` status.

The writer inserts the platform job with `ON CONFLICT DO NOTHING`. If another live job already exists, the writer returns that existing job.

`PlatformTrendingRebuildSchedulerService` periodically enqueues `PLATFORM_TRENDING_PLAYERS_REBUILD` so the read model can refresh when players enter or leave the time window even if no match is created, edited, deleted, or rebuilt.

The scheduler checks periodically and enqueues at most one platform rebuild per configured minimum interval. The job writer's live `dedupeKey` protection prevents duplicate live platform rebuild jobs.

Default behavior:

- check interval: 1 hour;
- minimum enqueue interval: 24 hours.

Environment controls:

- `PLATFORM_TRENDING_REBUILD_SCHEDULER_DISABLED=true` disables the scheduler;
- `PLATFORM_TRENDING_REBUILD_CHECK_INTERVAL_MS` overrides the check interval;
- `PLATFORM_TRENDING_REBUILD_MIN_ENQUEUE_INTERVAL_MS` overrides the minimum enqueue interval.

This checkpoint does not add:

- an admin/dev trigger;
- an API endpoint;
- UI.

## Projection rules

The projection service should be deterministic and idempotent.

Running it repeatedly against the same source data should produce the same rows and order.

The first scoring version is `PLATFORM_TRENDING_PLAYERS_V1`.

The current defaults are:

- 30-day trend window;
- exactly 3 ranked players when at least 3 players are eligible;
- minimum 2 recent matches.

The highlighted group for a player is the active group where that player has the best current rank among groups in which they played at least one match inside the selected window.

Tie-breaking for highlighted group selection is deterministic:

1. best `currentRank`;
2. most recent-window matches in that group;
3. most recent-window wins in that group;
4. `groupId` ascending.

## Future read API

The future read API should read from `PlatformTrendingPlayer`, not recompute trending players at request time.

It should resolve cheap display fields by joining from stored identifiers:

- `userId` -> `User.firstName` / `User.lastName`;
- `highlightGroupId` -> `Group.name`;
- `highlightGroupMemberId` -> `GroupMember.currentRank` and other current group-member display data if needed.

The next checkpoint should add the read API after this projection contract has deployed successfully.