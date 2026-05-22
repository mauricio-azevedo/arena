# Development Setup

This document describes the expected local development workflow for BeachRank.

BeachRank is a monorepo with two applications:

```txt
api/  NestJS backend
web/  Next.js frontend
```

## Prerequisites

Recommended tools:

- Node.js compatible with the project package manager setup;
- npm or the package manager defined by the repository lockfiles;
- PostgreSQL-compatible database, usually Neon for hosted development;
- GitHub access to the repository.

Check the root and app-specific package files before installing dependencies.

## Repository layout

```txt
beachrank/
  api/
    prisma/
    src/
  web/
    src/
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

```txt
cd api
install dependencies
configure .env
run Prisma generation/migrations
start the NestJS dev server
```

Expected responsibilities of the backend dev server:

- expose API endpoints;
- connect to PostgreSQL through Prisma;
- validate auth and permissions;
- execute domain transactions.

## Frontend setup

Typical frontend workflow:

```txt
cd web
install dependencies
configure .env
start the Next.js dev server
```

Expected responsibilities of the frontend dev server:

- render the mobile-first web app;
- call the backend API through `NEXT_PUBLIC_API_URL` or equivalent configuration;
- manage client-side auth token behavior;
- show route and feature loading states.

## Prisma workflow

After schema changes:

1. update `api/prisma/schema.prisma`;
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
- lint passes;
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
