# Database Guide

Arena uses PostgreSQL with Prisma as the backend database access layer.

The production-like hosted database provider is Neon.

## Source of truth

The schema source of truth is:

```txt
api/prisma/schema.prisma
```

Generated Prisma client files should not be edited manually.

## Core models

Important models currently include:

- `User`
- `Group`
- `GroupInvite`
- `GroupMember`
- `Match`
- `MatchPlayer`
- `FeedItem`

## Domain relationships

### User and GroupMember

A `User` is global.

A `GroupMember` is the user's group-scoped membership.

Group-specific state belongs on `GroupMember`, including:

- display name;
- rating;
- role;
- left/active state.

### Group and Match

A `Match` belongs to a `Group`.

A group deletion cascades to matches and feed items through schema relations.

### Match and MatchPlayer

A `Match` has four `MatchPlayer` records.

`MatchPlayer` stores player-level historical snapshots, including display name and rating before/after.

### Match and FeedItem

Some feed items are match-derived.

Example:

- `MATCH_BLOWOUT` / `Atropelo!`

Match-derived feed items should generally be removed when the match is deleted.

The current schema supports this through the `FeedItem.match` relation with cascade behavior.

## Prisma migrations

When changing schema:

1. update `api/prisma/schema.prisma`;
2. create a migration;
3. regenerate Prisma client;
4. verify backend compiles;
5. update docs if the schema change affects product behavior, architecture, API contracts, or QA.

Do not ship schema changes without migration strategy.

## Generated Prisma files

Generated files live under:

```txt
api/src/generated/prisma
```

Rules:

- do not manually edit generated files;
- regenerate them through Prisma tooling;
- if generated files change in a PR, make sure they correspond to schema changes.

## Transactions

Use transactions when multiple writes must remain consistent.

Examples:

```txt
create match
→ create Match
→ create MatchPlayers
→ update ratings
→ sync feed items
```

```txt
edit match
→ replace MatchPlayers
→ recalculate ratings
→ sync feed items
```

```txt
accept invite
→ update invite usage
→ create/activate membership
→ create feed item
```

## Rating data

Rating state is persisted in several places:

### `GroupMember.rating`

Current rating for a member in a group.

### `Match` rating fields

Team-level before/after/expected/actual snapshots.

### `MatchPlayer` rating fields

Player-level before/after/delta snapshots.

See [`../architecture/rating-architecture.md`](../architecture/rating-architecture.md).

## Feed data

`FeedItem` stores persisted product moments.

Important design choices:

- feed items are persisted, not reconstructed on every feed load;
- event metadata is JSON and type-specific;
- event visibility is stored per item;
- source-domain flows are responsible for creating/syncing relevant feed items.

See [`../architecture/feed-architecture.md`](../architecture/feed-architecture.md) and [`../product/feed-events.md`](../product/feed-events.md).

## Neon guidance

Neon is a hosted PostgreSQL provider with project/branch concepts.

When working with Neon:

- verify the correct project and branch before destructive operations;
- never reset a production database casually;
- prefer dev/staging branches for risky testing;
- confirm migrations against a non-production branch first when possible;
- document manual production database operations in PRs or runbooks.

## Resetting a development database

For local/dev only, a reset usually means:

1. confirm you are not connected to production;
2. drop/reset schema or use the project's Prisma reset workflow;
3. reapply migrations;
4. regenerate Prisma client if needed;
5. seed data if the project has seed scripts;
6. restart backend/frontend dev servers.

Exact commands should be kept aligned with package scripts and Prisma setup.

## Data consistency rules

1. A match must always have exactly four distinct players.
2. A player cannot appear twice in the same match.
3. A match cannot end in a draw.
4. Match writes that affect ratings must preserve rating snapshots.
5. Match-derived feed events should be synced in the same transaction as the match write.
6. Retroactive match creation/edit/delete must preserve rating history through recalculation.
7. Group-scoped data must not be treated as global user data.

## Indexing considerations

Current schema includes indexes for common access patterns such as:

- group lookup;
- group member lookup;
- match lookup by group and date;
- feed item lookup by visibility, group, type, actor, subject, match, and occurrence date.

When adding a new query pattern, consider whether an index is needed.

Do not add indexes blindly. Add them when a real or expected query pattern justifies the write/storage cost.

## Schema change checklist

Before merging a schema change:

- migration included;
- generated client updated if required;
- affected API contracts updated;
- affected product docs updated;
- affected QA cases updated;
- rollback risk understood;
- production data impact considered.
