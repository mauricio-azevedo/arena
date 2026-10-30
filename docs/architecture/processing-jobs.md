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

The worker runs on wakes, not on a clock (ADR 0009, #302). Three things wake it:

- **An enqueue.** Write paths create the job inside their own transaction, where the claim query
  cannot see it yet, and signal the worker once that transaction commits
  (`ProcessingJobWriterService.wake()`, an in-process event). Enqueueing outside a transaction
  wakes the worker by itself.
- **Startup.** Picks up whatever a crash or a deploy left behind.
- **Its own timer.** When a drain ends, the worker asks the database for the next moment something
  becomes claimable — the earliest `availableAt` of a `PENDING` row, or the lock expiry of a
  `PROCESSING` one — and arms a single `setTimeout` for it, clamped to [250 ms, 60 min]. Nothing
  queued means no timer: an idle queue sends no queries, which is what lets the Neon compute
  suspend.

A wake drains: it claims pending jobs ordered by `availableAt` and `createdAt` using
`FOR UPDATE SKIP LOCKED`, in batches of `PROCESSING_WORKER_BATCH_SIZE`, until a pass claims
nothing — so a job enqueued mid-drain, by a request or by another job, is picked up without
waiting for a timer. One drain runs at a time; wakes that arrive during one earn exactly one more
pass. Every batch starts by releasing `PROCESSING` rows older than
`PROCESSING_JOB_LOCK_TIMEOUT_MS`, wherever they were locked.

Wakes and timers are hints. The table stays the source of truth and the claim query decides, so a
missed hint delays a job and never loses one.

The runner dispatches claimed jobs by `scope`:

- `GROUP` jobs run the current group projection pipeline.
- `PLATFORM` jobs fail explicitly until a concrete platform job type and handler are added.

Group jobs continue to update group ranking projection state, feed projections, member stats, and
group home summaries.

Failures retry with `min(60, 2 ** attemptCount)` s of backoff until `maxAttempts`; the retry's
`availableAt` is what the idle timer waits for.

### Shutdown

`main.ts` calls `app.enableShutdownHooks()`, so `SIGTERM` reaches the worker: it unsubscribes,
clears its timer, stops claiming and awaits the job in flight. A job that outlives the platform's
kill grace dies with the process and leaves a locked row, released by the next drain's sweep.

### Multiple instances

The wake is in-process. `SKIP LOCKED` already keeps concurrent claims safe, but a write on one
instance is invisible to the others until their next local drain. Setting
`PROCESSING_WORKER_SAFETY_POLL_MS` (off by default, floored at an hour, since every poll
reactivates the database compute for its full idle window) bounds that lag.
