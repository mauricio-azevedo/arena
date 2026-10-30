@AGENTS.md

---

# Arena — Working Reference for AI Agents

Arena is a mobile-first web app for casual beach tennis groups: create groups,
invite friends, register doubles matches, track group-scoped ratings/rankings,
and surface a social activity feed. This section is a fast index of how the system
actually works so you can be productive immediately. For depth, follow the linked
docs — and keep them current when you change behavior.

## Stack & repo shape

pnpm-workspaces monorepo (`pnpm-workspace.yaml`: `apps/*`, `packages/*`), tasks run by
Turborepo (`turbo.json`). `packages/contracts` (`@arena/contracts`) holds the error codes and
avatar keys both apps share, plus request and response schemas one subpath per API module
(`@arena/contracts/matches`) — every module, so no response is declared twice.

```txt
apps/api/   NestJS 12 · Prisma 7 (pg adapter) · JWT · in-DB job queue · PostgreSQL
apps/web/   Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · lucide
docs/       product / design / architecture / engineering / qa
```

- **DB**: PostgreSQL 16. Local: `just db-up` → `localhost:5433`
  (`arena/arena`, db `arena`). Hosted: Neon (verify branch before destructive ops).
- **Deploy**: `apps/web` → Vercel (Root Directory `apps/web`; root `vercel.json` limits
  auto-deploys to `main`). `apps/api` → Render (Root Directory = repo root;
  `pnpm turbo run build --filter=@arena/api...` / `start:prod`). Details:
  `docs/engineering/development-setup.md`.

## Commands

```bash
# repo root — one install for every workspace package
pnpm install
pnpm run build             # turbo run build: contracts → api generate → apps; cached
pnpm run test              # turbo run test
pnpm run lint:check        # or lint (eslint --fix)
pnpm run format:check      # or format (prettier --write)
# api
cd apps/api && pnpm exec prisma migrate dev && pnpm exec prisma generate
pnpm run dev               # dev server
pnpm run build             # nest build only; `generate` runs via turbo (or `pnpm run generate`)
# web
cd apps/web && pnpm run dev
pnpm run build && pnpm run lint
```

Any app script also runs from the root as `pnpm --filter @arena/<app> <script>`.
`node` and `pnpm` may not be on PATH in this environment (nvm; `.nvmrc` pins 24);
read JSON/config files directly rather than via `node -e`.

## Architecture in one screen

- **Backend layering**: thin controllers → services own all logic. Services split
  by role: `*-reader` (queries+viewer filtering), `*-writer` (persistence),
  `*-orchestrator` (generator+writer), `*-generator` (input→draft), `*-projection`
  (rebuild derived state), `*-read` (read a read model). Request bodies: zod schema from
  `@arena/contracts/<module>`, parsed per route by `ZodValidationPipe`; business rules
  imperative in services, throwing Nest HTTP exceptions. Multi-write flows use
  `prisma.$transaction`; services take an
  optional `tx`.
- **⚠️ Async pipeline (key fact)**: match create/update/delete write the match +
  4 placeholder players, mark it `PENDING`, and **enqueue a `ProcessingJob`** — they
  do NOT compute ratings inline. A Postgres-backed worker (`processing/`, claims
  with `FOR UPDATE SKIP LOCKED`, retries w/ backoff) then runs the cascade:
  rating projection (full recalc) → ranking movements → member stats → match feed
  items → ranking-movement feed → group home summary → platform-trending rebuild.
  **Ratings/rankings are eventually consistent**; reads must tolerate
  `processingStatus != PROCESSED`. (Note: `docs/architecture/rating-architecture.md`
  describes an older synchronous "fast path" — the math is right, the execution
  model is now this queue. `system-architecture.md` is authoritative.)
- **Auth**: JWT (`JWT_SECRET`, 7d, bcrypt 10), `{ sub, email }`. `JwtAuthGuard` /
  `OptionalJwtAuthGuard` + `@CurrentUser()`. Authz lives in services; frontend
  route guards are UX-only — backend is the authority.
- **Frontend**: `app/*` route files are thin and render feature components from
  `features/*`. No React Query/SWR: server components `await` API fns; client
  components fetch in `useEffect` with a `loading|ready|error` machine + `isCurrent`
  guard; all calls `cache:'no-store'`. JWT in `localStorage` (`arena_access_token`),
  passed explicitly into each `apiRequest`. `loading.tsx` = destination-shaped
  skeletons.

## Data model essentials

- **`GroupMember` is the hub.** Competitive state (rating, rank, role, `leftAt`)
  lives there, never on `User`. Same user can have different ratings per group.
  Unique `(groupId, userId)`; child rows FK on composite `(id, groupId)` so
  cross-group refs are impossible.
- **Match**: exactly 4 players / 2 teams, no draws, soft-deleted via `deletedAt`,
  has `processingStatus`. `MatchPlayer` stores rating/rank **snapshots** so old
  matches stay explainable.
- **Derived read models** (rebuilt by projections, never hand-edit): `MatchRankingSnapshot`,
  `RankingMovement`, `GroupMemberStats`, `GroupRankingProjection`, `GroupHomeSummary`,
  `PlatformTrendingPlayer`. If one looks wrong, re-run its projection (enqueue a
  rebuild job), don't patch rows.
- **FeedItem**: persisted product moments (not a raw log); unique `(type, matchId)`.
- IDs are uuid; `createdAt`/`updatedAt` standard; ratings `Float`, init `1000`,
  algorithm label `BEACH_ELO_V1`.

## Conventions (both apps)

- kebab-case files with role suffixes; PascalCase classes/components; camelCase
  verb methods; **named exports** (except Next route files); `import type` for
  types. Feature-first organization; keep code local until genuinely shared.
- Backend types in per-module `types/`; no `dto/`. Request bodies and responses:
  `@arena/contracts/<module>` (zod schema; dates are `isoDateTime` codecs, so `z.output` = API
  return with `Date`, `z.input` = wire the web imports). Services annotate their return with the
  `XResponse` type; the web imports the resource name, `import type` only. A feature `*.type.ts`
  holds view-models only — never a field list that copies a response.
- Logging: `structuredLog('domain.event', {...})` (`observability/structured-log.ts`).
- API routes are use-case shaped (`GET /me/profile/summary`), never UI-shaped; no
  `/api` prefix.

## Where to look

| Topic                                     | Doc                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Full runtime architecture (authoritative) | `docs/architecture/system-architecture.md`                                                             |
| Entities, relationships, derived models   | `docs/architecture/data-model.md`                                                                      |
| Table/enum/index/migration reference      | `docs/engineering/database-reference.md`                                                               |
| Backend conventions + API route map       | `docs/engineering/backend-conventions.md`                                                              |
| Frontend conventions                      | `docs/engineering/frontend-conventions.md`                                                             |
| Subsystems                                | `docs/architecture/{feed-architecture,rating-architecture,processing-jobs,weekly-highlights}.md`       |
| ADRs                                      | `docs/decisions/`                                                                                      |
| Product rules                             | `docs/product/{glossary,feed-events}.md`                                                               |
| Org rules · DB ops · setup                | `docs/code-organization.md` · `docs/engineering/database.md` · `docs/engineering/development-setup.md` |
| QA flows                                  | `docs/qa/critical-flows.md`                                                                            |

## When you change things

- Schema: edit `schema.prisma` → `prisma migrate dev` → `prisma generate` →
  confirm build → update `database-reference.md` + `data-model.md` + affected docs.
- New derived state: add a `*-projection.service.ts` and call it from
  `processing-job-runner.service.ts`.
- Request body or response change: edit the schema in `packages/contracts/src/<module>.ts`; both
  apps fail `tsc` until they match, and the e2e strict parse fails on an unpromised field. New
  module: add its subpath to `packages/contracts/package.json` `exports`.
- Per `docs/README.md`, update docs in the same PR when product behavior, feed/
  rating rules, auth, schema, key UX, API contracts, or QA flows change.
  </content>
