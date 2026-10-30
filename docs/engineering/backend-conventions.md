# Backend Conventions (NestJS / `api`)

Observed conventions in `apps/api/src` (verified 2026-06-17). This is the _descriptive_
companion to the _prescriptive_ [`../code-organization.md`](../code-organization.md)
— it records what the code actually does today.

---

## 1. Module & file layout

- One NestJS module per domain area (`groups`, `matches`, `feed`, `ranking`,
  `processing`, `home-highlights`, `me`, `members`, `users`, `auth`,
  `group-invites`). `PrismaModule` and `AuthModule` are shared infrastructure and
  imported where needed; `PrismaModule` is effectively global DB access.
- Large modules split services by responsibility and use subfolders, e.g.
  `me/profile-summary/*.service.ts`, `feed/generators/`, `feed/types/`.
- File suffixes (kebab-case): `*.controller.ts`, `*.service.ts`, `*.module.ts`,
  `*.guard.ts`, `*.decorator.ts`, `*.type.ts` / `*.types.ts`, `*.generator.ts`.
- Role-based service suffixes: `*-reader` / `*-writer` / `*-orchestrator` /
  `*-projection` / `*-read` / `*-runner` / `*-scheduler` / `*-worker`.
- Classes are PascalCase with the suffix (`GroupsController`, `FeedReaderService`,
  `GroupCreatedFeedItemGenerator`); methods are camelCase verbs
  (`createGroup`, `findUserFeed`, `syncGroupRatings`).
- **Named exports** everywhere. `import type` for type-only imports.

## 2. Controllers (thin)

Controllers only: declare routes, apply guards, read `@Param`/`@Body`/
`@CurrentUser`, call a service, return its result. No Prisma, no business logic,
no response shaping. Request bodies are typed inline in the handler signature.

```ts
@Post()
@UseGuards(JwtAuthGuard)
create(@Param('groupId') groupId: string, @CurrentUser() user: AuthUser,
       @Body() body: { gamesA: number; gamesB: number; /* … */ }) {
  return this.matchesService.create(groupId, user.sub, body);
}
```

## 3. Services & domain logic

- Services own validation, authorization, and persistence. One clear
  responsibility per service; split rather than grow a god-service.
- **Request bodies are parsed at the route**: `@Body(new ZodValidationPipe(schema))`
  (`common/zod-validation.pipe.ts`) with the schema from `@arena/contracts/<module>`; the
  service takes the inferred type. A shape failure answers 400 with one `message` entry per
  issue. No `class-validator`, no global pipe. Modules not yet converted keep inline body
  types and shape checks in the service (`code-quality-backlog.md`).
- **Business rules are imperative** in services. Throw Nest HTTP exceptions:
  `BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`,
  `UnauthorizedException`.
- **Machine-readable error codes** (`common/api-errors.ts`): when the frontend must
  react to a _specific_ business failure (not just show the message), throw via the
  coded factories — `codedBadRequest(code, message)` / `codedConflict` /
  `codedUnauthorized`. They stamp the full body `{ statusCode, error, code, message }`
  (Nest passes object bodies through verbatim, so the factories carry the standard
  fields themselves). The `API_ERROR_CODES` registry is **append-only** — the web app
  imports it from `@arena/contracts` and branches on `code`, never on copy.
  Plain string exceptions remain the default everywhere else.
- Multi-write workflows run in `this.prisma.$transaction(async (tx) => …)`.
  Services accept an optional `tx` (`Prisma.TransactionClient | PrismaService`,
  often aliased `PrismaClientLike`) so they compose inside an outer transaction.
- Constants like `RATING_ALGORITHM = 'BEACH_ELO_V1'` live at module top.

## 4. Prisma usage

- Access only through injected `PrismaService` inside services.
- Generated client in `apps/api/src/generated/prisma/` — import enums from
  `../generated/prisma/enums`, types from `../generated/prisma/client`. Never edit
  generated files.
- `$queryRaw`/`$executeRaw` used for soft-delete filtering (`deletedAt IS NULL`)
  and queue locking (`FOR UPDATE SKIP LOCKED`); `upsert` for idempotent read-model
  writes; `select`/`include` to shape responses (don't leak `passwordHash`).

## 5. DTOs / types

- No `dto/` folders. A request body is a zod schema plus its `z.infer` type in
  `@arena/contracts/<module>` (`matchBodySchema`, `MatchBody`); modules not yet converted keep
  inline types or `*.type.ts`.
- A response is a `z.strictObject` in the same file (`matchResponseSchema`), dates as the
  `isoDateTime` codec; the service annotates its return with the `z.output` type
  (`Promise<MatchResponse>`) and shapes the Prisma `select`/`omit` to the schema. What the API
  sends minus internals, not only what the web reads today. Never parse a response in production;
  the e2e spec parses one per route (ADR 0008).
- Internal contracts and unconverted responses live in per-module `types/`
  (`feed-item-draft.type.ts`, `claim-summary.type.ts`). One important type per file.
- Generators implement a shared generic interface
  (`FeedItemGenerator<Input>` → `FeedItemDraft | null`).
- Values the web app must match exactly (`API_ERROR_CODES`, `AVATAR_COLOR_KEYS`) are imported from
  `@arena/contracts` (`packages/contracts`), never redeclared. `common/api-errors.ts` re-exports the
  codes next to the exception factories that stamp them.

## 6. Auth

- `JwtAuthGuard` (required) and `OptionalJwtAuthGuard` (anonymous-friendly) in
  `auth/`; `@CurrentUser()` returns `AuthUser = { sub, email }`.
- JWT: `JWT_SECRET`, `expiresIn 7d`, bcrypt 10 rounds.
- Authorization decisions live in services (membership/role/viewer checks), not
  only in guards.

## 7. Async processing

- Match writes enqueue a `ProcessingJob`; the worker runs the projection cascade.
- **Enqueue inside the transaction, `wake()` after it commits.** The job row belongs
  to the same transaction as the write that caused it; the worker's claim cannot see
  it until that commits, so whoever owns the transaction calls
  `processingJobs.wake()` right after. Enqueueing outside a transaction wakes the
  worker by itself. Never `await` or branch on a wake: it is a hint, and the claim
  query decides (ADR 0009).
  Add new derived state by writing a `*-projection.service.ts` and calling it from
  `processing-job-runner.service.ts`. See
  [`../architecture/processing-jobs.md`](../architecture/processing-jobs.md) and
  §3 of [`../architecture/system-architecture.md`](../architecture/system-architecture.md).

## 8. Logging

`structuredLog('domain.event', { …fields })` + `errorLogFields(error)` from
`observability/structured-log.ts`. Use namespaced event names
(`processing_job.claimed`, `rating_projection.completed`).

## 9. Testing & tooling

- Jest (`*.spec.ts` under `src`, e2e under `test/`). Coverage is currently thin —
  rating/projection logic is the highest-value place to add tests.
- From `apps/api` (or `pnpm --filter @arena/api <script>` from the repo root): `pnpm run build`
  (runs `prisma generate` then `nest build`), `pnpm run lint` (eslint --fix), `pnpm test`.
  Prettier at the repo root (`pnpm run format`).

## 10. API route map

| Method & path                                                                                                                             | Auth                         | Module          |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------- |
| `POST /auth/register`, `POST /auth/login`                                                                                                 | public                       | auth            |
| `GET /auth/me`                                                                                                                            | header token                 | auth            |
| `GET /feed`                                                                                                                               | optional                     | feed            |
| `GET /feed/groups/:groupId`                                                                                                               | optional                     | feed            |
| `POST /groups`                                                                                                                            | required                     | groups          |
| `GET /groups/home`, `GET /groups/home/all`                                                                                                | optional                     | groups          |
| `GET /groups`, `GET /groups/:groupId`                                                                                                     | public                       | groups          |
| `POST /groups/:groupId/invites` (optional `targetGroupMemberId` ⇒ closed; a plain request reuses the active invite, so links stay stable) | required (admin)             | group-invites   |
| `GET /groups/:groupId/invites/:token`, `POST …/:token/accept`                                                                             | varies                       | group-invites   |
| `GET /invites/:token` (OPEN ⇒ guest roster · CLOSED ⇒ target summary)                                                                     | public/required              | public-invites  |
| `GET /invites/:token/guests/:guestId/summary`                                                                                             | public (token)               | public-invites  |
| `POST /invites/:token/claim/:guestId`, `POST /invites/:token/accept`                                                                      | required                     | public-invites  |
| `POST/DELETE/GET /groups/:groupId/members/:memberId/claim-email` (legacy — no UI creates anchors anymore)                                 | required (admin)             | claim-offers    |
| `GET/POST /me/claims/:stubId`, `…/confirm`, `…/decline`                                                                                   | required (email match)       | claim-offers    |
| `POST /groups/:groupId/members`, `GET …/members`                                                                                          | varies                       | members         |
| `POST /groups/:groupId/members/guest`                                                                                                     | required (any active member) | members         |
| `GET /groups/:groupId/members/:memberId/profile`                                                                                          | public                       | members         |
| `POST /groups/:groupId/members/:memberId/unlink`                                                                                          | required (admin)             | members         |
| `DELETE /groups/:groupId/members/:memberId`                                                                                               | required (admin)             | members         |
| `POST /groups/:groupId/matches`                                                                                                           | required                     | matches         |
| `GET …/matches`, `GET …/matches/:id`                                                                                                      | varies                       | matches         |
| `PATCH …/matches/:id`, `DELETE …/matches/:id`                                                                                             | required                     | matches         |
| `GET /groups/:groupId/ranking`                                                                                                            | varies                       | ranking         |
| `GET /groups/:groupId/processing-jobs`, `POST …/retry-failed`                                                                             | varies                       | processing      |
| `GET /me/groups`                                                                                                                          | required                     | me              |
| `GET /me/profile/summary`, `GET /me/profile/matches`                                                                                      | required                     | me              |
| `PATCH /me/profile`, `PATCH /me/password`                                                                                                 | required                     | me              |
| `GET /users/:userId/profile/summary`, `…/profile/matches`, `…/groups`                                                                     | viewer-scoped                | users           |
| `GET /home/weekly-highlights`                                                                                                             | optional                     | home-highlights |
| `GET /health` (liveness only — no database access; the hosting platform's health check polls it)                                          | public                       | health          |

Routes are use-case oriented (`GET /me/profile/summary`), never UI-shaped. No
global `/api` prefix.

---

The **Code Quality Baseline** in `AGENTS.md` applies here too: reuse the existing
service/helper instead of a parallel copy, extract on real reuse ("local by default,
shared by necessity" — `code-organization.md`), and don't duplicate cross-cutting
logic (friendly-error mapping, token handling) across modules.
</content>
