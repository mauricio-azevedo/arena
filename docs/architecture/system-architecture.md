# System Architecture (Reverse-Engineered)

This document is a reverse-engineered, code-accurate description of how Arena is
built and how a request flows through the system end to end. It complements the
higher-level [`overview.md`](./overview.md): where the two disagree, prefer the
code and this document.

> Verified against the codebase on 2026-06-17. When you change runtime behavior,
> update this file in the same PR.

---

## 1. Shape of the system

Arena is a pnpm-workspaces monorepo with two deployable apps and a PostgreSQL database.

```txt
arena/
  apps/api/   NestJS 12 backend (REST, Prisma, in-DB job queue)
  apps/web/   Next.js 16 (App Router, React 19) frontend
  docs/       documentation (this file lives here)
```

| Layer    | Tech                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (radix-luma), lucide                   |
| Backend  | NestJS 12, TypeScript, Prisma 7 (`@prisma/adapter-pg` + `pg` Pool), JWT (`@nestjs/jwt`), bcrypt |
| Database | PostgreSQL 16 (local via `docker-compose`; Neon in hosted environments)                         |
| Deploy   | `web` on Vercel (`vercel.json`, only `main` auto-deploys); `api` + DB hosted separately         |

`@arena/contracts` (`packages/contracts`) is the shared package: error codes, avatar keys,
and request and response schemas, one subpath per API module (`@arena/contracts/matches`).
Modules not yet converted still re-declare their response types by hand in
`apps/web/src/types/api.ts` and per-feature `*.type.ts` files; keep those in sync when backend
responses change.

---

## 2. Backend runtime architecture

### 2.1 Module composition

`apps/api/src/app.module.ts` wires feature modules. `PrismaModule` (global DB access)
and `AuthModule` (JWT) are the shared infrastructure; every feature module is a
self-contained NestJS module (controller + services + types).

```txt
PrismaModule  AuthModule
GroupsModule  MembersModule  MatchesModule  GroupInvitesModule
RankingModule RatingModule(implicit via services) MeModule UsersModule
FeedModule    ProcessingModule  HomeHighlightsModule
```

### 2.2 Layering and the CQRS-ish split

Controllers are thin: they apply guards, read params/body/current user, and call
a service. All domain logic lives in services. As modules grow, services are
split by responsibility rather than kept as one god-service. The recurring roles:

| Suffix / role               | Responsibility                                               | Example                                                                                                               |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `*.service.ts`              | Use-case business logic                                      | `matches.service.ts`                                                                                                  |
| `*-reader.service.ts`       | Query/read + viewer filtering, returns response shapes       | `feed-reader.service.ts`                                                                                              |
| `*-writer.service.ts`       | Persistence only, takes a typed draft                        | `feed-writer.service.ts`                                                                                              |
| `*-orchestrator.service.ts` | Coordinates generator(s) + writer                            | `feed-orchestrator.service.ts`                                                                                        |
| `*-generator.ts`            | Pure-ish transform: domain input → draft (one per feed type) | `feed/generators/*.generator.ts`                                                                                      |
| `*-projection.service.ts`   | Recompute derived/read-model state                           | `rating-projection.service.ts`, `group-member-stats-projection.service.ts`, `weekly-highlights-projection.service.ts` |
| `*-read.service.ts`         | Read a precomputed read model                                | `weekly-highlights-read.service.ts`                                                                                   |

### 2.3 Bootstrap (`apps/api/src/main.ts`)

Minimal on purpose:

- CORS from `CORS_ORIGIN` (comma-separated, default `http://localhost:3001`).
- `enableShutdownHooks()`, so `SIGTERM` reaches `onModuleDestroy`: the processing
  worker stops claiming and finishes the job in flight (ADR 0009).
- Listens on `PORT` (default `3000`).
- **No global `ValidationPipe`**, no global prefix. Routes are exactly what the
  `@Controller()` declares (e.g. `/groups`, not `/api/groups`).

### 2.4 Validation & DTOs

There is **no `class-validator`** and no global pipe. A request body's shape is a zod schema
in `@arena/contracts/<module>` (`packages/contracts/src/matches.ts`); the controller parses it
with `@Body(new ZodValidationPipe(schema))` (`common/zod-validation.pipe.ts`), which answers
400 with one `message` entry per issue, and the service receives the inferred type. Business
rules stay imperative in services, throwing Nest HTTP exceptions (`BadRequestException`,
`NotFoundException`, `ForbiddenException`, `ConflictException`, `UnauthorizedException`):
`MatchesService.resolvePlayerIds` rejects a player appearing twice. Converted so far: matches,
members and groups; the other modules still type bodies inline and check shape in the service
(`code-quality-backlog.md`).

Responses are zod schemas in the same module file (ADR 0008): dates are `isoDateTime` codecs
(`packages/contracts/src/iso-datetime.ts`), so `z.output` is the API's return type (`Date`) and
`z.input` is the wire the web imports (ISO string). Services annotate their returns with the
`XResponse` type and shape the Prisma query to it (`MatchesService.matchInclude`: `omit` the
processing internals, identity-only `select` on the player's member). Nothing parses responses in
production; `apps/api/test/app.e2e-spec.ts` parses one body per route with the strict schema, so
an unpromised field fails CI.

### 2.5 Persistence (Prisma)

`PrismaService` extends `PrismaClient` and connects through a `pg.Pool` +
`@prisma/adapter-pg` (`prisma/prisma.service.ts`). The generated client is output
to `apps/api/src/generated/prisma/` (git-ignored, regenerated by `prisma generate`) —
enums are imported from `../generated/prisma/enums`, types from
`../generated/prisma/client`.

Patterns in use: `$transaction(async (tx) => …)` for multi-write workflows, raw
SQL (`$queryRaw` / `$executeRaw`) for soft-delete filtering and queue locking,
and `upsert` for idempotent read-model writes. Services accept an optional
`tx`/`PrismaClientLike` argument so they compose inside an outer transaction.

### 2.6 Observability

`observability/structured-log.ts` exposes `structuredLog(event, fields)` (JSON
string) and `errorLogFields(error)`. All significant operations emit a named
event, e.g. `processing_job.claimed`, `rating_projection.completed`,
`feed_projection.skipped`. Use this format for any new logging.

---

## 3. The async processing pipeline (most important architectural fact)

> **This supersedes the synchronous "fast path" described in
> [`rating-architecture.md`](./rating-architecture.md).** That document still
> describes the conceptual rating math correctly, but the _execution model_ has
> moved to an asynchronous in-database job queue. Match writes no longer compute
> ratings inline.

### 3.1 How a match write actually flows

`MatchesService.create/update/remove` (`matches.service.ts`) each:

1. Open a transaction, validate, and check the caller is an active group member.
2. Write the `Match` + four `MatchPlayer` rows **with placeholder rating
   snapshots** (`ratingBefore/After/Delta = 0`, team rating fields `null`).
3. Mark the match `processingStatus = PENDING` (soft-delete sets `deletedAt`).
4. **Enqueue a `ProcessingJob`** (`MATCH_CREATED` / `MATCH_UPDATED` /
   `MATCH_DELETED`) in the same transaction.
5. Return the match immediately (ratings not yet computed).

Reads filter to non-deleted matches via raw SQL (`findActiveMatchIds`).

### 3.2 The worker

`processing/` implements a custom Postgres-backed queue (no Bull/Redis):

- `ProcessingWorkerService` — runs on wakes, never on a clock (ADR 0009, #302):
  an enqueue signals it after its transaction commits, startup recovers what a
  crash or deploy left, and a single `setTimeout` covers the next row that
  becomes claimable (a due retry, an expiring lock). A wake drains until a pass
  claims nothing; an idle queue sends no queries, so the database compute
  suspends. Disabled with `PROCESSING_WORKER_DISABLED=true`. Tunables:
  `PROCESSING_WORKER_BATCH_SIZE` (claims per pass, default 5),
  `PROCESSING_WORKER_SAFETY_POLL_MS` (off by default, floored at an hour; only
  useful with more than one instance). Details:
  [`processing-jobs.md`](./processing-jobs.md).
- `ProcessingJobRunnerService` — claims jobs with `FOR UPDATE SKIP LOCKED`,
  runs them, and handles retries: `attemptCount` vs `maxAttempts` (default 5),
  exponential backoff, stale-lock recovery, `lastError` capture, terminal
  `FAILED` state. Transaction/lock timeouts via
  `PROCESSING_JOB_TRANSACTION_TIMEOUT_MS` / `PROCESSING_JOB_LOCK_TIMEOUT_MS`.
- `ProcessingJobWriterService` / `ProcessingJobReaderService` — enqueue (with
  dedupe), and read job summaries / retry failed jobs for a group.

### 3.3 What a GROUP job does (the projection cascade)

For a match-related GROUP job the runner recomputes derived state in order:

```txt
1. rating-projection.syncGroupRatings        → full recalc of GroupMember.rating
                                                + Match/MatchPlayer snapshots
                                                + MatchRankingSnapshot (leaders/movements)
2. ranking-movement.syncGroupRankingState     → RankingMovement rows + visibility
3. group-member-stats-projection.sync...      → GroupMemberStats (matches/wins)
3b. group-member-partner-stats-projection.sync → GroupMemberPartnerStats (per-teammate
                                                 matches/wins; powers profile "duplas")
4. feed.syncMatchFeedItems                    → match-derived FeedItems
5. feed.syncGroupRankingMovementFeedItems     → RANKING_MOVEMENT FeedItems
6. group-home-summary.syncGroupSummary        → GroupHomeSummary read model
7. weekly-highlights-projection.sync...       → GroupHighlight read model ("Essa semana")
```

The cascade is entirely GROUP-scoped. The retired `PlatformTrendingPlayer` read model,
its PLATFORM job, and the rebuild scheduler were removed — the home "Essa semana" rail
reads `GroupHighlight` (see [`weekly-highlights.md`](./weekly-highlights.md)).

### 3.4 Consequence: rating is full-recalc, eventually consistent

The current rating projection recomputes the whole group timeline (ordered by
`playedAt asc, createdAt asc`) on every match change — there is no append-only
inline shortcut anymore. Newly created matches briefly show `PENDING` /
placeholder ratings until the worker processes them. UI and reads should tolerate
`processingStatus` not being `PROCESSED` yet.

### 3.5 Why this design (ADRs)

See `docs/decisions/`:

- `0000-use-markdown-architectural-decision-records.md` — ADRs follow MADR 4 (#260).
- `0001-persist-feed-events.md` — feed events are persisted, not reconstructed.
- `0002-snapshot-match-ratings.md` — match/player rating snapshots are stored.
- `0003-use-contextual-skeletons-for-route-loading.md` — frontend loading UX.
- `0004-unify-guest-invite-and-claim.md` — guest invite + claim become one primitive (accepted, implemented).
- `0005-monorepo-layout-and-tooling.md` — `apps/*` + `packages/*` on pnpm workspaces (accepted, #256).
- `0006-turborepo-task-graph.md` — Turborepo runs the workspace task graph (accepted, #258).
- `0007-zod-request-contracts.md` — request bodies are zod schemas in `@arena/contracts` (accepted, #267).
- `0008-zod-codec-response-contracts.md` — responses are zod codec schemas, one declaration for both apps (accepted, #267).
- `0009-event-driven-processing-worker.md` — the worker wakes on writes instead of polling (accepted, #302).

Deeper subsystem docs: [`processing-jobs.md`](./processing-jobs.md),
[`feed-architecture.md`](./feed-architecture.md),
[`weekly-highlights.md`](./weekly-highlights.md).

---

## 4. Authentication & authorization

- **Login/register** (`auth/auth.service.ts`): bcrypt (10 rounds), JWT signed
  with `JWT_SECRET`, `expiresIn: 7d`, payload `{ sub: userId, email }`. `register`
  also accepts an optional `nickname`.
- **Frontend auth UX**: login and signup are the full-screen `AuthScreen`
  (`features/auth/components/auth-screen.tsx`) served at `/login` and `/register`,
  toggled between modes in place. Signed-out entry points navigate there via
  `buildAuthPath` (`features/auth/auth-navigation.ts`), carrying a `?redirect=`. On
  success a full-page navigation to that target re-runs every client
  `getAccessToken()` branch and server components. A dead session is bridged to
  `/login?…&notice=expired` by `SessionExpiryRedirect`, mounted at the root.
- **`JwtAuthGuard`** — required auth; 401 if missing/invalid Bearer token.
- **`OptionalJwtAuthGuard`** — passes through anonymous, attaches `req.user` if a
  valid token is present (used by endpoints with personalized-but-public content,
  e.g. `GET /groups/home`).
- **`@CurrentUser()`** decorator extracts `req.user: AuthUser` (`{ sub, email }`).
- Authorization is enforced in services (e.g. "only active group members can
  manage matches", viewer-scoped profile data). Frontend guards
  (`apps/web/src/lib/route-policy.ts`) are UX-only; the backend is the authority.

---

## 5. Request lifecycle (end to end)

```txt
React (server component fetch or client useEffect)
  → apps/web/src/features/<feature>/api/<x>.api.ts
  → lib/api-client.ts  apiRequest<T>(path, { token, body, cache:'no-store' })
  → fetch NEXT_PUBLIC_API_URL + path  (Authorization: Bearer <jwt from localStorage>)
  → NestJS controller (guard + @CurrentUser)
  → service (validate, authorize, Prisma transaction)
  → [match writes] enqueue ProcessingJob ──► worker ──► projection cascade
  → JSON response → frontend renders; derived data appears after worker runs
```

---

## 6. Frontend runtime architecture

- **App Router** (`apps/web/src/app`). Route `page.tsx` files are thin server
  components that fetch and render a feature component from `apps/web/src/features/*`.
  `loading.tsx` files render destination-shaped skeletons (see
  [`../design/loading-and-skeletons.md`](../design/loading-and-skeletons.md)).
- **Data fetching**: no React Query/SWR. Server components `await` API functions;
  client components fetch in `useEffect` with a `loading | ready | error` state
  machine and an `isCurrent` guard against stale updates. All API calls use
  `cache: 'no-store'`.
- **Auth on the client**: JWT in `localStorage` (`arena_access_token`), decoded
  manually (`lib/auth.ts`); the token is passed _explicitly_ into each API call,
  never auto-injected.
- **Chrome & navigation**: `AppShell` wraps screens, enforces route policy
  (`lib/route-policy.ts`), and renders `AppTopBar` + `BottomNav`.
  `NavigationProvider` keeps a sessionStorage nav stack for safe back behavior.
  `lib/internal-href.ts` guards against open redirects.
- **UI kit**: shadcn/ui in `components/ui/*`, Tailwind v4, `cn()` from
  `lib/utils.ts`, dark theme by default (`<body className="... dark">`),
  Portuguese (`lang="pt-BR"`) copy.

See [`backend-conventions.md`](../engineering/backend-conventions.md) and
[`frontend-conventions.md`](../engineering/frontend-conventions.md) for the full
convention catalog, and [`data-model.md`](./data-model.md) /
[`../engineering/database-reference.md`](../engineering/database-reference.md) for
the data layer.

---

## 7. Environments & operations

- **Local DB**: `just db-up` → Postgres 16 on `localhost:5433`
  (`arena/arena`, db `arena`).
- **Hosted DB**: Neon (project/branch model — verify branch before destructive
  ops; see [`../engineering/database.md`](../engineering/database.md)).
- **Key env vars**: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`
  (api); `NEXT_PUBLIC_API_URL` (web); worker tuning —
  `PROCESSING_WORKER_DISABLED`, `PROCESSING_WORKER_BATCH_SIZE`,
  `PROCESSING_WORKER_SAFETY_POLL_MS`, `PROCESSING_JOB_LOCK_TIMEOUT_MS`,
  `PROCESSING_JOB_TRANSACTION_TIMEOUT_MS`.
- **Deploy**: `web` → Vercel, only `main` branch (`vercel.json`).
  </content>
  </invoke>
