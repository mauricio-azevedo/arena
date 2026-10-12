# Development Setup

This document describes the expected local development workflow for Arena.

Arena is a pnpm-workspaces monorepo with two applications:

```txt
apps/api/  NestJS backend
apps/web/  Next.js frontend
```

## Prerequisites

Required tools:

- Node.js 22 — `.nvmrc` pins the major (`nvm use`);
- pnpm 11 — the exact version is the `packageManager` field of the root `package.json`
  (`corepack enable` installs it automatically);
- Docker for the local PostgreSQL (`docker-compose up -d` → `localhost:5433`), or a hosted Neon
  database;
- GitHub access to the repository.

Install once, from the repo root:

```bash
pnpm install
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
  docs/
```

See [`../code-organization.md`](../code-organization.md) for code organization rules.

## Environment variables

The exact source of truth should be the project's `.env.example` files when present.

Common variables include:

```txt
DATABASE_URL
JWT_SECRET
NEXT_PUBLIC_API_URL
```

Guidelines:

- never commit real secrets;
- keep local `.env` files out of git;
- document new required environment variables when adding features;
- use separate credentials for local/dev/prod when possible.

## Backend setup

Typical backend workflow:

```bash
cd apps/api
# configure .env (DATABASE_URL, JWT_SECRET)
pnpm exec prisma migrate dev   # applies migrations and regenerates the client
pnpm run start:dev
```

Expected responsibilities of the backend dev server:

- expose API endpoints;
- connect to PostgreSQL through Prisma;
- validate auth and permissions;
- execute domain transactions.

## Frontend setup

Typical frontend workflow:

```bash
cd apps/web
# configure the env file (NEXT_PUBLIC_API_URL)
pnpm run dev
```

Expected responsibilities of the frontend dev server:

- render the mobile-first web app;
- call the backend API through `NEXT_PUBLIC_API_URL` or equivalent configuration;
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
- TypeScript passes;
- `pnpm run lint:check` and `pnpm run format:check` pass;
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

## Deployment

Both apps deploy from `main`; neither host builds other branches.

- **Web → Vercel.** Root Directory `apps/web`. pnpm is detected from the root `pnpm-lock.yaml` and
  the `packageManager` field. `apps/web/vercel.json` limits automatic deployments to `main` (Vercel
  reads `vercel.json` from the Root Directory).
- **API → Render.** Root Directory stays the repo root: Render cannot read files above it, and the
  lockfile lives there. Build `pnpm install --frozen-lockfile && pnpm --filter @arena/api build`,
  start `pnpm --filter @arena/api start:prod` (runs with `apps/api` as cwd), health check `/health`.
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

Check:

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
