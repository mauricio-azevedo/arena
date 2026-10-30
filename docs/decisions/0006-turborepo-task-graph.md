---
status: accepted
date: 2026-10-13
---

# Turborepo runs the workspace task graph

## Context and Problem Statement

`@arena/contracts` is built output imported by both apps, so `build`, type-aware lint and tests in
each app depend on its `build`. The Prisma client is generated, not installed, so the same tasks in
the API depend on `generate` (#265: lint ran first in CI and failed with 1784 errors). `pnpm -r`
runs scripts in topological order but knows nothing about `generate`, caches nothing, and each host
and recipe spells the order out by hand. What runs the workspace tasks in dependency order?

## Decision Drivers

- Task order derived from declared dependencies, in one place.
- Unchanged packages are not rebuilt, locally or in CI.
- One command per host (`--filter=<app>...`) that includes the app's workspace dependencies.

## Considered Options

- Turborepo
- `pnpm -r` with the order written into scripts and recipes
- Nx

## Decision Outcome

Chosen option: "Turborepo", because it models `generate` as a task and caches on inputs with a
one-file configuration; Vercel reads the same file.

### Consequences

- Good, because `turbo.json` is the only place that knows `generate` precedes `build`, `lint:check`
  and `test`; an unchanged package is a cache hit.
- Good, because Render and Vercel each run one filtered command.
- Bad, because env vars read at task time must be declared (strict mode) or the cache is stale;
  one more root dev dependency.

### Confirmation

`pnpm turbo run build` from clean runs `contracts#build` and `api#generate` before the apps; a
second run reports cache hits. `turbo run lint:check test` without a prior build is green.

A task whose result depends on something turbo cannot hash declares `cache: false`, and the
database is the case: `test:e2e` asserts against whatever `DATABASE_URL` points at, so a replayed
green would prove nothing about the database at hand. It reports `cache bypass, force executing`
on every run while still inheriting `^build` and `generate` from the graph (verified 2026-10-30:
two consecutive runs, both executed; a broken assertion fails the run).

## Pros and Cons of the Options

### Turborepo

- Good, because tasks, `dependsOn`, `inputs`, `outputs` and `env` are declared in one JSON file.
- Good, because Vercel detects it and provides remote cache without configuration.
- Bad, because strict env mode is a new failure class until every build-time variable is declared.

### `pnpm -r` with the order written out

- Good, because nothing new to install.
- Bad, because no cache, and `generate` has to be inserted by hand in every script and recipe that
  runs lint, test or build.

### Nx

- Good, because it also infers tasks from the tools present.
- Bad, because it adds plugins and a project graph for two apps and one package; more surface than
  the problem needs.

## More Information

Implemented in #258. Supersedes the `pnpm -r` scripts introduced in #256.
