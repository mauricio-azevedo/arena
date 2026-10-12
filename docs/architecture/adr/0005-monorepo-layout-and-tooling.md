# ADR 0005: apps/\* layout on pnpm workspaces

## Status

Accepted — #256.

## Context

Two apps in one repo with three lockfiles and no workspace. Two contracts are kept in sync by
comment because nothing can be shared between the apps without publishing. Readers arriving cold
recognize `apps/*` + `packages/*` with one lockfile.

## Decision

We will move to `apps/api`, `apps/web` and `packages/*` on pnpm workspaces: one lockfile, strict
per-package `node_modules`, install scripts run only when allow-listed.

Rejected: two repositories — right when apps have separate owners or release cadences; neither
here. npm workspaces — right when nothing beyond Node may be installed; its hoisting allows
undeclared imports, the bug class the shared contracts must not have.

## Consequences

- Easier: one install, one lockfile; an undeclared import fails at install, not in production;
  `packages/*` can hold shared code, so `@arena/contracts` replaces the comment-synced contracts;
  Vercel skips builds of unaffected packages.
- Harder: every environment needs pnpm (`packageManager` + corepack); every dependency with
  install scripts needs an allow-list verdict; deploy settings depend on the layout (see
  `development-setup.md`).
- Follow-ups: #257 CI on pnpm; #258 `@arena/contracts` and Turborepo (ADR 0006).
