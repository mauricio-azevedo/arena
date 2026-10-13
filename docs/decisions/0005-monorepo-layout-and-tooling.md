---
status: accepted
date: 2026-10-13
---

# apps/\* layout on pnpm workspaces

## Context and Problem Statement

Two apps in one repo with three lockfiles and no workspace. Two contracts are kept in sync by
comment because nothing can be shared between the apps without publishing. Readers arriving cold
recognize `apps/*` + `packages/*` with one lockfile. How should the repository be laid out so
code can be shared and the layout is recognizable?

## Decision Drivers

- Share code between the apps without publishing.
- An undeclared import fails at install, not in production.
- A layout a cold reader recognizes.

## Considered Options

- `apps/*` + `packages/*` on pnpm workspaces
- `apps/*` + `packages/*` on npm workspaces
- Two repositories

## Decision Outcome

Chosen option: "pnpm workspaces", because it is the only option that shares code and fails
undeclared imports at install.

### Consequences

- Good, because one install, one lockfile; `packages/*` can hold shared code, so
  `@arena/contracts` replaces the comment-synced contracts; Vercel skips builds of unaffected
  packages.
- Bad, because every environment needs pnpm (`packageManager` + corepack); every dependency with
  install scripts needs an allow-list verdict; deploy settings depend on the layout (see
  `development-setup.md`).

### Confirmation

`pnpm install --frozen-lockfile` and `pnpm run build` at the repo root; an import not declared
by the importing package fails the build.

## Pros and Cons of the Options

### pnpm workspaces

- Good, because strict per-package `node_modules`: an undeclared import cannot resolve.
- Good, because install scripts run only when allow-listed.
- Bad, because pnpm must be installed everywhere, including both hosts.

### npm workspaces

- Good, because nothing beyond Node needs installing — right when that is the constraint.
- Bad, because hoisting allows undeclared imports, the bug class the shared contracts must not
  have.

### Two repositories

- Good, because apps with separate owners or release cadences stay independent — neither here.
- Bad, because sharing code still requires publishing.

## More Information

Implemented in #256 (PR #261). Follow-ups: #257 CI on pnpm; #258 `@arena/contracts` and
Turborepo (ADR-0006).
