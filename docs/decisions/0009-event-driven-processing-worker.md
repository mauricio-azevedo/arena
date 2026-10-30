---
status: accepted
date: 2026-10-30
---

# in-process wakes instead of polling for the processing worker

## Context and Problem Statement

The worker claimed jobs on a 1 s `setInterval`: a stale-lock sweep plus a `SKIP LOCKED` claim
against the database every second, forever, from an always-on instance. Neon Free suspends a
compute after 5 min without queries and allows 100 CU-hrs/month; the poll never let it suspend,
so ~6 CU-hrs/day exhausted the month's allowance in 17 days and production was down from
2026-10-17 until the period reset. How does the worker pick a job up in under a second while
sending no queries at all when the queue is idle?

## Considered Options

- in-process wake after commit + drain until empty + one-shot timer for the next due row
- a longer poll interval
- Postgres `LISTEN`/`NOTIFY`
- Redis / BullMQ

## Decision Outcome

Chosen option: "in-process wake after commit". The enqueue stays inside the write's transaction —
the queue table is still the only source of truth — and the path that owns the transaction signals
the worker once it commits. The worker drains until a pass claims nothing, then asks the database
for the next moment something becomes claimable (a due retry, or the lock expiry of a job whose
process died) and arms a single timer for it. Nothing queued means no timer and no queries, so the
compute suspends 5 min after the last request.

A longer interval trades the lag for nothing: any interval ≤ 5 min still prevents suspension, and
a longer one costs 5 min of compute per poll while delaying every rating. `LISTEN`/`NOTIFY` needs
a connection held open — which Neon drops at suspend, and whose reconnect wakes the compute — and
still needs a poll for retries and expired locks. Redis means new infrastructure and moves the
enqueue out of the match transaction, so a partial failure loses the job.

### Consequences

- Good, zero database traffic while the queue is idle; pickup after a write stays sub-second.
- Good, wakes are only hints: every one is verified by the claim query, so a lost hint delays a
  job and never loses one.
- Good, `enableShutdownHooks()` makes a deploy's SIGTERM stop claiming and finish the job in
  flight instead of orphaning its lock.
- Bad, the signal is in-process: with more than one instance, a write on one is invisible to the
  others until their next local drain. `PROCESSING_WORKER_SAFETY_POLL_MS` (off by default,
  floored at an hour) bounds that lag when the time comes.
- Bad, one residual on a single instance: a lock orphaned by `SIGKILL` after the new instance's
  startup drain waits for the next write anywhere in the system. It needs a job to outlive the
  deploy overlap plus the kill grace, and every drain releases stale locks globally.

## More Information

Issue #302. Worker behavior: [`../architecture/processing-jobs.md`](../architecture/processing-jobs.md).
Neon's compute lifecycle and what counts as activity:
[`../engineering/database.md`](../engineering/database.md).
