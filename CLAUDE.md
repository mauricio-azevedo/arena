@AGENTS.md

---

# Arena — Working Reference for AI Agents

Arena is a mobile-first web app for casual beach tennis groups: create groups,
invite friends, register doubles matches, track group-scoped ratings/rankings,
and surface a social activity feed. This section is a fast index of how the system
actually works so you can be productive immediately. For depth, follow the linked
docs — and keep them current when you change behavior.

## Stack & repo shape

Monorepo, no shared package between apps (the frontend re-declares the API
contract by hand).

```txt
api/   NestJS 11 · Prisma 7 (pg adapter) · JWT · in-DB job queue · PostgreSQL
web/   Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · lucide
docs/  product / design / architecture / engineering / qa
```

- **DB**: PostgreSQL 16. Local: `docker-compose up` → `localhost:5433`
  (`arena/arena`, db `arena`). Hosted: Neon (verify branch before destructive ops).
- **Deploy**: `web` → Vercel, only `main` auto-deploys (`vercel.json`).

## Commands

```bash
# api
cd api && npm install && npx prisma migrate dev && npx prisma generate
npm run start:dev          # dev server
npm run build              # prisma generate + nest build
npm run lint && npm test
# web
cd web && npm install && npm run dev
npm run build && npm run lint
# repo root
npm run format             # prettier
```

`node` may not be on PATH in this environment; read JSON/config files directly
rather than via `node -e`.

## Architecture in one screen

- **Backend layering**: thin controllers → services own all logic. Services split
  by role: `*-reader` (queries+viewer filtering), `*-writer` (persistence),
  `*-orchestrator` (generator+writer), `*-generator` (input→draft), `*-projection`
  (rebuild derived state), `*-read` (read a read model). Validation is imperative
  (no `class-validator`, no global pipe); throw Nest HTTP exceptions. Multi-write
  flows use `prisma.$transaction`; services take an optional `tx`.
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
- Backend types in per-module `types/`; no `dto/` in practice. Frontend mirrors the
  API in `web/src/types/api.ts` + feature `*.type.ts` — **sync by hand**.
- Logging: `structuredLog('domain.event', {...})` (`observability/structured-log.ts`).
- API routes are use-case shaped (`GET /me/profile/summary`), never UI-shaped; no
  `/api` prefix.

## Where to look

| Topic | Doc |
| --- | --- |
| Full runtime architecture (authoritative) | `docs/architecture/system-architecture.md` |
| Entities, relationships, derived models | `docs/architecture/data-model.md` |
| Table/enum/index/migration reference | `docs/engineering/database-reference.md` |
| Backend conventions + API route map | `docs/engineering/backend-conventions.md` |
| Frontend conventions | `docs/engineering/frontend-conventions.md` |
| Subsystems | `docs/architecture/{feed,rating,processing-jobs,platform-trending-players}-*.md` |
| ADRs | `docs/architecture/adr/` |
| Product rules | `docs/product/{glossary,feed-events}.md` |
| Org rules · DB ops · setup | `docs/code-organization.md` · `docs/engineering/database.md` · `docs/engineering/development-setup.md` |
| QA flows | `docs/qa/critical-flows.md` |

## When you change things

- Schema: edit `schema.prisma` → `prisma migrate dev` → `prisma generate` →
  confirm build → update `database-reference.md` + `data-model.md` + affected docs.
- New derived state: add a `*-projection.service.ts` and call it from
  `processing-job-runner.service.ts`.
- Backend response shape change: update `web/src/types/api.ts` (and feature types).
- Per `docs/README.md`, update docs in the same PR when product behavior, feed/
  rating rules, auth, schema, key UX, API contracts, or QA flows change.
</content>
