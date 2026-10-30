# Observability Runbook

What Arena exposes about its own health, and what to do first when it reports a
problem. Scoped to the signals that exist today.

## Signals

| Signal                            | Where                            | Answers                                                |
| --------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Structured logs (`structuredLog`) | Render → service `arena` → Logs  | What the process did, as named JSON events             |
| `GET /health`                     | `https://beachrank.onrender.com` | Is the process up (liveness). Never touches the DB     |
| `GET /health/ready`               | `https://beachrank.onrender.com` | Can this instance serve DB-backed requests (readiness) |

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

| Code      | Means                                                                      |
| --------- | -------------------------------------------------------------------------- |
| `P2010`   | The query failed. Unreachable server reaches you as this via the pg driver |
| `P1001`   | Prisma could not connect at all                                            |
| `TIMEOUT` | Still pending after 5 s — a suspended or overloaded compute                |

A code alone does not say which; the log line does.

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

## Related

- [`development-setup.md`](./development-setup.md) — local troubleshooting.
- [`database.md`](./database.md) — Neon and Prisma operations.
- [`../architecture/system-architecture.md`](../architecture/system-architecture.md)
  §2.6 — the logging convention itself.
