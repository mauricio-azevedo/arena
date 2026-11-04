# Development Setup

This document describes the expected local development workflow for Arena.

Arena is a pnpm-workspaces monorepo; Turborepo runs the task graph:

```txt
apps/api/            NestJS backend
apps/web/            Next.js frontend
packages/contracts/  values both apps share (error codes, avatar keys)
```

## Prerequisites

Required tools:

- Node.js 24 — `.nvmrc` pins the major (`nvm use`);
- pnpm 11 — the exact version is the `packageManager` field of the root `package.json`
  (`corepack enable` installs it automatically);
- Docker for the local PostgreSQL (`just db-up` → `localhost:5433`), or a hosted Neon
  database;
- [`just`](https://just.systems) — the recipes in the root `justfile` (`just --list`);
- GitHub access to the repository.

Install once, from the repo root:

```bash
just setup
```

One lockfile (`pnpm-lock.yaml`) covers every workspace package; there are no per-app installs.

## Repository layout

```txt
arena/
  apps/
    api/
      prisma/
      src/
    web/
      src/
  packages/
    contracts/
  docs/
```

See [`../code-organization.md`](../code-organization.md) for code organization rules.

## Environment variables

The exact source of truth should be the project's `.env.example` files when present.

Common variables include:

```txt
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_API_BASE_URL
```

Turbo runs tasks in strict env mode: a variable read at task time must be listed under `env` in
`turbo.json` or the task does not see it, and a cached result would not depend on it. Today only
`NEXT_PUBLIC_API_BASE_URL` (inlined by `next build`) qualifies; the API reads its variables at
runtime, outside turbo. No build task needs `DATABASE_URL` — `prisma.config.ts` resolves it only
when a `migrate` or `db` command reads the datasource, so `generate` and `build` run without it.

Guidelines:

- never commit real secrets;
- keep local `.env` files out of git;
- document new required environment variables when adding features;
- use separate credentials for local/dev/prod when possible.

## Backend setup

Typical backend workflow:

```bash
just setup                     # once: install, .env from .env.example, Postgres, migrations, data
just dev                       # API on :3000 and web on :3001; Ctrl-C stops both
```

`just dev` builds `packages/*` first, then watches them alongside both apps; `nest --watch` picks
up a rebuilt `@arena/contracts`, `next dev` may need a restart.

### Parallel checkouts

A linked git worktree gets its own database on the same server, so two branches can hold
different migrations and `test:e2e` only ever wipes its own rows. `just env-local` — which
`just setup` runs — derives it once into `apps/api/.env` (`arena_<worktree directory>` in place of
`arena`); Prisma creates the database on the first `migrate deploy`, and everything that reads
that file follows. A plain clone keeps `arena`, and a `DATABASE_URL` that does not point at
localhost is left as it is.

The Postgres container stays shared: `docker-compose.yml` fixes the compose project name, so
`just db-up` from any checkout returns the one server on `localhost:5433`. `just db-drop`
discards the current worktree's database when its branch is done; in a plain clone it refuses
to run.

Schema changes are applied by their author, not by `just dev`:

```bash
cd apps/api
pnpm exec prisma migrate dev   # creates the migration and regenerates the client
```

Expected responsibilities of the backend dev server:

- expose API endpoints;
- connect to PostgreSQL through Prisma;
- validate auth and permissions;
- execute domain transactions.

### Seed data

`just setup` ends in `just db-seed`, so the first `just dev` opens on groups with history instead
of every empty state. The seed owns an empty database and nothing else: it leaves a database that
already has rows untouched, and `just db-reseed` is the explicit "discard my local data" command.
Both refuse a `DATABASE_URL` that is not localhost.

A seeded database holds two groups — Quinta-feira (8 players) and Praia Norte (6) — with 13 matches
each, arranged so rankings, win streaks and weekly highlights all have something to show. Every
player signs in with their first name at `@arena.test` (`gus@arena.test`, `leo@arena.test`, …) and
the password `arena123`.

Ratings and rankings appear a moment after the API comes up, not at seed time: the seed enqueues
one `GROUP_RANKING_REBUILD` per group and the worker runs the cascade on startup.

## Frontend setup

Typical frontend workflow:

`just dev` starts it with the API. Alone:

```bash
pnpm --filter @arena/web dev   # :3001; API base defaults to http://localhost:3000
```

Expected responsibilities of the frontend dev server:

- render the mobile-first web app;
- call the backend API through `NEXT_PUBLIC_API_BASE_URL` (defaults to the local API);
- manage client-side auth token behavior;
- show route and feature loading states.

## Prisma workflow

After schema changes:

1. update `apps/api/prisma/schema.prisma`;
2. create/apply the appropriate migration if the database schema changes;
3. regenerate Prisma client;
4. update generated files only through the normal Prisma workflow;
5. update docs when schema changes affect product, API, architecture, or QA.

Do not manually edit generated Prisma files.

## Local development checklist

Before opening a PR, ideally verify:

- backend starts;
- frontend starts;
- `just ci` passes (same steps as CI; needs a migrated `DATABASE_URL` for e2e). Turbo caches
  per task in `.turbo/`; a task with a cache hit replays its logs — `--force` reruns everything.
  `test:e2e` is the exception: `cache: false`, so it always executes against the database you
  gave it;
- critical changed flows work manually;
- migrations are included when schema changes require them;
- docs are updated when product/architecture/API behavior changes.

## PR validation expectations

A strong PR description should include:

- summary;
- product/UX impact;
- implementation notes;
- validation performed;
- migration notes when applicable;
- rollback notes when risky.

## TypeScript configuration

A package's `tsconfig.json` is its type-check config and has to cover every file its test runner
feeds the compiler. Narrowing belongs in `tsconfig.build.json`, which exists only to keep specs
out of the emitted output. Reversing the two hides errors instead of preventing them:
`packages/contracts` once excluded `src/**/*.spec.ts` from `tsconfig.json` while `ts-jest`
compiled those specs with that very config, so the specs were checked against a config that
disowned them. TypeScript 5.9 inferred ambient `node` and `jest` types anyway; TypeScript 6
stopped, and twenty-odd errors surfaced months after the mistake was made (#337).

For the same reason, `"types"` is explicit wherever a runner's globals are relied on — nothing
should depend on what happens to be in `node_modules/@types`. Audited per package (#357):

| Package              | Test runner                                                  | `tsconfig.json` scope                               | `"types"`          |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ------------------ |
| `apps/api`           | jest + ts-jest over `src/**/*.spec.ts`, `test/*.e2e-spec.ts` | no `include`/`exclude` — every `.ts` in the package | `["node", "jest"]` |
| `packages/contracts` | jest + ts-jest over `src/**/*.spec.ts`                       | `["src"]` — specs included                          | `["node", "jest"]` |
| `apps/web`           | none                                                         | `**/*.ts`, `**/*.tsx`, `**/*.mts`                   | inferred           |

`apps/web` is the deliberate exception. It has no test runner and no spec files, so there are no
runner globals to pin, and Next.js regenerates `next-env.d.ts` on every build and reaches its own
types through a triple-slash reference that `"types"` does not gate — a pinned list there would be
upkeep with nothing to catch. Adding a test runner to `apps/web` means adding `"types"` in the
same change.

## Dead code

`pnpm run knip` reports unused files, exports, types and dependencies. One root `knip.jsonc`
covers the whole workspace — a per-package run cannot see cross-package imports, so
`@arena/contracts` reads as unused in both apps. It is part of `just ci`, so the run is green:
a new finding fails CI.

Fix a finding rather than ignore it. Usually that means deleting dead code, or dropping `export`
from something only its own file uses. `ignoreDependencies` is for packages reached without an
import — each entry in `knip.jsonc` says why.

## Dependencies

- `pnpm update -r` moves every package to the newest version inside its range and rewrites the
  manifest floor to the version that was tested. pnpm holds releases younger than one day
  (`minimumReleaseAge`); Dependabot waits seven (`cooldown` in `.github/dependabot.yml`).
- Dependabot opens one weekly PR for minor and patch updates and one PR per major. Majors are
  deliberate upgrades: read the migration guide, upgrade in their own PR.
- `overrides` in `pnpm-workspace.yaml` exist only for transitive packages with an open advisory
  that their parent pins. Each entry names the parent and the condition that retires it; check the
  list whenever a parent gets a major.
- A Dependabot alert is dismissed only when no shippable fix exists (no patched version published,
  or the fix is a major the parent has not adopted) and the package is dev tooling that never sees
  untrusted input. The dismissal comment names the parent. Alerts on runtime code are fixed, not
  dismissed.

## Deployment

Both apps deploy from `main`; neither host builds other branches.

- **Web → Vercel.** Root Directory `apps/web`. pnpm is detected from the root `pnpm-lock.yaml` and
  the `packageManager` field. Node comes from `engines.node` in `apps/web/package.json`: Vercel
  ignores `.nvmrc`, and that field overrides the dashboard setting. The root `vercel.json` limits automatic deployments to `main`: Vercel
  reads its `git` settings from the repository root, not from the Root Directory (verified
  2026-10-13: a branch push with the file only under `apps/web` created a preview deployment).
- **API → Render.** Root Directory stays the repo root: Render cannot read files above it, and the
  lockfile lives there. Node comes from `.nvmrc`. Start `pnpm --filter @arena/api start:prod` (runs with `apps/api` as cwd),
  health check `/health`. Build:

  ```bash
  pnpm install --frozen-lockfile && pnpm turbo run build --filter=@arena/api...
  ```

  The trailing `...` builds `@arena/contracts` and runs `generate` before the API.
  Migrations are deployed explicitly with `pnpm --filter @arena/api exec prisma migrate deploy`;
  they are not part of the build.

### API container image

`apps/api/Dockerfile` packages the API. The build context is the repo root — `turbo prune` reduces
the workspace to `@arena/api` and `@arena/contracts`, so the install layer is invalidated by their
manifests alone:

```bash
just docker-build              # arena-api:local
docker run --rm -p 3000:3000 -e DATABASE_URL=… -e JWT_SECRET=… arena-api:local
```

The image carries `dist/`, the generated Prisma client and production dependencies only — the
`prod-deps` install passes `--no-optional` as well as `--prod`, which is what keeps the Prisma CLI
and Studio out of it (reason in the Dockerfile). No dependency compiles a native binding, so no
stage installs a build toolchain. It runs as the `node` user, serves on `PORT` (default 3000),
and declares a `HEALTHCHECK` against `/health` —
liveness, not the database probe.

A pull request builds the image and discards it. A push to `main` publishes it to
`ghcr.io/mauricio-azevedo/arena-api` under two tags: `:<commit sha>`, the immutable one a service
pins, and `:main`, the newest build. The push uses `GITHUB_TOKEN` with `packages: write`. The
package is private, so a host pulling it needs a registry credential — a personal access token
with `read:packages`.

Render still runs the native Node runtime above. Pointing it at the image is a dashboard change
(runtime Docker, the `:<sha>` tag, that credential), and the AWS move after it is a change of where
the same image is pulled rather than another build.

## Troubleshooting

### Frontend cannot reach API

Check:

- frontend environment variable for API base URL;
- backend server is running;
- browser network tab;
- CORS or auth errors;
- token presence/expiration.

### Backend cannot reach database

Ask the API first: `curl -i localhost:3000/health/ready`. A 503 names the failing
dependency and its error code — `P1001` unreachable, `TIMEOUT` slow. Codes and
what to do with them: [`observability.md`](./observability.md).

Then check:

- `DATABASE_URL`;
- Neon branch/project state;
- IP/network restrictions if any;
- Prisma migration status;
- database reset state.

### Prisma types do not match schema

Regenerate Prisma client and restart TypeScript/dev servers.

### Auth behavior seems stale

Check browser local storage and clear token if needed.

## Documentation responsibility

When implementing a feature, update docs if the feature changes:

- product behavior;
- feed events;
- rating/ranking rules;
- access control;
- data model;
- API contracts;
- critical UX patterns;
- QA/regression flows.
