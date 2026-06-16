# Processing Jobs Architecture

`ProcessingJob` is Arena's persisted background job queue.

This queue currently processes group-scoped jobs. The schema includes an explicit `scope` column so the system can evolve toward platform-scoped jobs without changing the queue shape again.

## Current scope

`GROUP` jobs belong to one group and require `groupId`.

Current job types:

- `MATCH_CREATED`
- `MATCH_UPDATED`
- `MATCH_DELETED`
- `GROUP_RANKING_REBUILD`

All current job types are group-scoped.

## Reserved scope

`PLATFORM` is reserved for future platform-wide projections.

A platform job type must only be added together with its real handler, enqueue path, observability, and validation. Do not add an executable platform job type before its processor exists.

## Scheduling

`availableAt` controls when a job becomes claimable by the worker.

## Dedupe

`dedupeKey` is reserved for singleton jobs. The database enforces at most one `PENDING` row per non-null `dedupeKey`.

This allows a future projection to coalesce repeated events while still allowing a new pending job to be created if another job with the same key is already `PROCESSING`.

## Invariants

Current database constraints enforce:

- `scope = 'GROUP'`
- `groupId IS NOT NULL`

Future platform jobs must add stricter constraints together with their first concrete job type.

## Worker behavior

The worker claims pending jobs ordered by `availableAt` and `createdAt` using `FOR UPDATE SKIP LOCKED`.

Group jobs continue to update group ranking projection state, feed projections, member stats, and group home summaries.
