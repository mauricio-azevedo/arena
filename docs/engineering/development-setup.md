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
runtime, outside turbo. `generate` gets `DATABASE_URL` via `passThroughEnv`: `prisma.config.ts`
refuses to load without it, but the generated client does not depend on its value.

Guidelines:

- never commit real secrets;
- keep local `.env` files out of git;
- document new required environment variables when adding features;
- use separate credentials for local/dev/prod when possible.

## Backend setup

Typical backend workflow:

```bash
just setup                     # once: install, .env from .env.example, Postgres, migrations
just dev                       # API on :3000 and web on :3001; Ctrl-C stops both
```

`just dev` builds `packages/*` first, then watches them alongside both apps; `nest --watch` picks
up a rebuilt `@arena/contracts`, `next dev` may need a restart.

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
dependency and its error code — `P2010`/`P1001` unreachable, `TIMEOUT` slow. Codes
and what to do with them: [`observability.md`](./observability.md).

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
