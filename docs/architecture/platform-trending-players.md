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

This checkpoint only adds the table shape and migration.

It does not add:

- the scoring algorithm;
- a projection service;
- a processing job type;
- a platform enqueue path;
- an API endpoint;
- UI.

## Future projection rules

The projection service should be deterministic and idempotent.

It should rebuild the full platform read model from source-of-truth tables, then delete stale rows that no longer belong in the result set.

The first executable platform job must be added together with the real projection handler.
