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

The table shape, migration, projection service, and first platform processing job now exist.

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

This checkpoint does not add:

- an admin/dev trigger;
- automatic scheduling;
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

The next checkpoint should add event-driven enqueueing for `PLATFORM_TRENDING_PLAYERS_REBUILD` after the relevant match-processing writes are committed.