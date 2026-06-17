# Platform Trending Players

`PlatformTrendingPlayer` is a platform-level read model for the future "Jogadores em alta" surface.

This table is not a source of truth. It is derived from match history, group membership, and ranking state.

## Source of truth

The source of truth remains:

- `Match`
- `MatchPlayer`
- `GroupMember`
- `Group`
- `User`

## Read model purpose

The read model keeps the future read path cheap. The UI should not compute platform-level trend rankings at request time.

Each row represents one user currently eligible for the platform trending list.

Stored fields include:

- trend rank;
- display name;
- trend score;
- recent match and win counts;
- all-time match and win counts;
- a highlighted group context;
- projection window metadata.

## Current checkpoint

The table shape, migration, projection service, and first platform processing job now exist.

The projection service is `PlatformTrendingPlayersProjectionService`.

It rebuilds `PlatformTrendingPlayer` from source-of-truth tables in one deterministic transaction:

- delete the previous read model rows;
- compute eligible players from match history;
- insert the newly ranked rows;
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

The initial defaults are:

- 30-day trend window;
- 20 ranked players;
- minimum 2 recent matches.

## Future projection rules

The future read API should read from `PlatformTrendingPlayer`, not recompute trending players at request time.

The next checkpoint should add an explicit admin/dev trigger for `PLATFORM_TRENDING_PLAYERS_REBUILD` before adding UI or public API behavior.
