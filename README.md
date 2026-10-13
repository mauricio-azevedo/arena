# Arena

[![CI](https://github.com/mauricio-azevedo/arena/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mauricio-azevedo/arena/actions/workflows/ci.yml)

Arena is a mobile-first web app for casual beach tennis groups.

It helps players create groups, invite friends, register doubles matches, track group-specific ratings, view rankings, follow activity, and build a personal sports history from casual games.

## Product scope

Arena is designed for casual groups, rotating doubles, quick match registration, local rankings, and lightweight social motivation.

Core areas:

- authentication and user identity;
- groups and memberships;
- invite links;
- doubles match registration;
- group-specific ratings and rankings;
- match history;
- profile and sports history;
- activity feed.

## Tech stack

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons

Backend:

- NestJS
- TypeScript
- Prisma
- PostgreSQL

## Repository structure

```txt
arena/
  apps/
    api/    NestJS backend
    web/    Next.js frontend
  docs/     product, engineering, and architecture documentation
```

Important documentation:

- `docs/code-organization.md`: code organization rules and architectural conventions.
- `docs/engineering/development-setup.md`: local development workflow and validation expectations.

## Domain model

Core entities:

- User: a real account in the system.
- Group: a social and sport context where matches happen.
- GroupMember: a user inside a group, including role and group-specific rating data.
- Match: a doubles match inside a group.
- MatchPlayer: a group member participating in a match.
- FeedItem: a persisted activity moment used to power the feed.

Important modeling decisions:

- ratings live on `GroupMember`, not directly on `User`;
- match participants store historical snapshots;
- feed items are persisted records, not only derived read-time projections.

## Local development

Node 22 (`.nvmrc`), pnpm 11 (`packageManager` in `package.json`; `corepack enable` installs it), Docker, and [`just`](https://just.systems).

```bash
just setup   # once: install, apps/api/.env from .env.example, PostgreSQL, migrations
just dev     # API on :3000, web on :3001; Ctrl-C stops both
just --list  # every recipe
```

Details and troubleshooting: `docs/engineering/development-setup.md`.

## Validation

`just ci` runs what CI runs: format, lint, build, unit tests, and the e2e smoke test against the local database.

## Engineering standards

Arena treats code organization as product quality.

Guidelines:

- organize by product feature and domain concept;
- keep code local until it is genuinely shared;
- prefer explicit business names over vague generic names;
- keep route files thin;
- keep API calls out of rendering components;
- separate components, helpers, types, mappers, API functions, and domain logic;
- document architectural, product, data model, API, or QA changes when they affect future work.

## Status

Arena is under active development.
