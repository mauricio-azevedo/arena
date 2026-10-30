# Observability Runbook

What Arena exposes about its own health, and what to do first when it reports a
problem. Scoped to the signals that exist today.

## Signals

| Signal                            | Where                            | Answers                                                |
| --------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Structured logs (`structuredLog`) | Render → service `arena` → Logs  | What the process did, as named JSON events             |
| `GET /health`                     | `https://beachrank.onrender.com` | Is the process up (liveness). Never touches the DB     |
| `GET /health/ready`               | `https://beachrank.onrender.com` | Can this instance serve DB-backed requests (readiness) |
| `health.readiness_ok` logs        | Render → Logs                    | How long the database takes to answer when it is well  |

Render's Health Check Path is `/health`, deliberately. Pointing it at
`/health/ready` would restart a healthy process on a database outage a restart
cannot fix.

## `GET /health/ready`

Public, no auth. Runs `SELECT 1` with a 5 s budget.

200:

```json
{ "status": "ok", "checks": { "database": { "status": "ok", "latencyMs": 42 } } }
```

503, within 5 s:

```json
{
  "status": "error",
  "checks": { "database": { "status": "error", "latencyMs": 5001, "error": "TIMEOUT" } }
}
```

`checks.database.error` is a code, never a message — messages carry the database
host, so they stay in the logs. What you will see:

| Code      | Means                                                            |
| --------- | ---------------------------------------------------------------- |
| `P1001`   | The server could not be reached. The ordinary outage             |
| `TIMEOUT` | Still pending after 5 s — a suspended or overloaded compute      |
| `P2010`   | The query itself failed for some other reason. Should not happen |

`P1001` is reported, not forwarded: the pg driver adapter wraps an unreachable
server as `P2010` ("raw query failed") and keeps the real cause in the message,
so the route unwraps it. A bare `P2010` therefore means something other than
connectivity broke `SELECT 1`, which is worth reading the log for.

## First response to a 503

1. **Neon console**, project `beachrank`. Check the **"Limit reached"** banner and
   **Usage** before anything else: the free plan's 100 CU-hours/month is the most
   likely cause, and it suspends compute rather than failing loudly.
2. **[Neon status](https://neonstatus.com)** — a provider incident needs waiting,
   not fixing.
3. **Render logs** for `health.readiness_failed` — one line per failed request,
   carrying `latencyMs` plus the error message and stack the body omits:

   ```json
   {
     "event": "health.readiness_failed",
     "dependency": "database",
     "latencyMs": 9,
     "errorName": "PrismaClientKnownRequestError",
     "errorMessage": "Raw query failed … Can't reach database server at …"
   }
   ```

   A low `latencyMs` means refused, not slow: check `DATABASE_URL` on Render and
   whether the Neon branch still exists.

Recovery is confirmed by `GET /health/ready` answering 200, not by the banner
clearing.

## Database latency when nothing is wrong

A healthy check logs its own latency, because nothing else records it and it
cannot be recovered after the fact:

```json
{
  "event": "health.readiness_ok",
  "dependency": "database",
  "latencyMs": 11,
  "sampleRate": 10
}
```

Checks slower than 1 s are logged every time with `"sampleRate": 1`; the rest are
sampled one in ten, so a public route cannot flood the log. `sampleRate` is how
many requests the line stands for — sum it to estimate the total, and weight by it
to rebuild the distribution. Cold starts live in the slow lines, which sampling
never drops.

## Related

- [`development-setup.md`](./development-setup.md) — local troubleshooting.
- [`database.md`](./database.md) — Neon and Prisma operations.
- [`../architecture/system-architecture.md`](../architecture/system-architecture.md)
  §2.6 — the logging convention itself.
