# Architecture Overview

BeachRank is a monorepo with a Next.js frontend, a NestJS backend, Prisma, and PostgreSQL on Neon.

```txt
beachrank/
  api/   NestJS backend
  web/   Next.js frontend
  docs/  project documentation
```

## System responsibilities

### Frontend (`web/`)

The frontend is responsible for:

- route rendering;
- mobile-first UI;
- user interactions;
- client-side auth token storage;
- feature-specific API calls;
- loading, error, empty, and skeleton states;
- navigation patterns;
- rendering feed, profile, groups, matches, and search experiences.

The frontend should not:

- know Prisma models directly;
- calculate authoritative ratings;
- enforce final security decisions;
- perform business-critical mutations without backend validation.

### Backend (`api/`)

The backend is responsible for:

- authentication and authorization;
- group, invite, member, match, rating, profile, and feed business logic;
- database transactions;
- persisted domain events;
- rating snapshots;
- API contracts;
- final enforcement of permissions.

### Database

PostgreSQL stores authoritative product state.

Prisma defines the schema and generated client used by the backend.

Important persisted concepts include:

- users;
- groups;
- group members;
- invites;
- matches;
- match players;
- feed items.

## High-level data flow

### Authenticated frontend request

```txt
User action
→ frontend feature API function
→ apiRequest with access token
→ NestJS controller
→ guard/decorator extracts current user
→ service performs business logic
→ Prisma transaction/query
→ response returned to frontend
→ UI renders result/state
```

### Match creation

```txt
Submit match form
→ POST match endpoint
→ validate score and players
→ confirm active group membership
→ create Match + MatchPlayers
→ update ratings
→ generate/sync feed events
→ return created match with players
```

### Feed loading

```txt
Home feed screen
→ GET /feed
→ FeedReaderService finds viewer groups and social context
→ query feed items visible to viewer
→ calculate feedScore
→ sort and return feed items
→ FeedItemCard renders each event type
```

## Architectural principles

### Feature-first organization

Code should be organized around product features and domain concepts.

Examples:

```txt
web/src/features/profile
web/src/features/groups
web/src/features/feed
api/src/feed
api/src/matches
```

See [`../code-organization.md`](../code-organization.md).

### Domain logic belongs in backend services

Controllers stay thin. Services own business behavior.

Examples:

- `MatchesService` owns match creation/update/delete workflows.
- `FeedOrchestratorService` owns feed event orchestration.
- `FeedReaderService` owns feed retrieval and viewer filtering.

### Persist important derived state

Some derived state should be persisted because it is part of historical product truth or needed for fast reads.

Examples:

- match rating snapshots;
- match player rating before/after/delta;
- feed events.

### Use transactions for consistency

Multi-write domain workflows should be transactional.

Examples:

- match create + rating update + feed event sync;
- match update + full rating recalculation + feed event sync;
- invite accept + membership update + feed event creation.

### Frontend guards improve UX, backend guards enforce security

Frontend access guards prevent confusing or broken screens.

Backend guards and service-level checks are the final authority.

Do not rely only on frontend route protection for permissions.

## Key modules

### `api/src/auth`

Authentication, JWT handling, current user decorators, and guards.

### `api/src/groups`

Group creation, group listing, group detail data, and group-level product behavior.

### `api/src/group-invites`

Invite generation and acceptance.

### `api/src/matches`

Match creation, editing, deletion, rating update orchestration, and match-level feed event sync.

### `api/src/feed`

Feed item persistence, generation, scoring, and reading.

### `api/src/me`

Authenticated user's profile data and profile-related tabs.

### `web/src/features/profile`

Own profile and public-profile-like profile experiences.

### `web/src/features/groups`

Group list, group detail tabs, group cards, and group-related UI.

### `web/src/features/feed`

Home feed loading and feed item rendering.

### `web/src/features/matches`

Match forms and match list rendering.

## Known architectural decisions

Current major decisions:

- feed events are persisted instead of reconstructed on every feed load;
- ratings are snapshotted per match;
- normal match creation uses an incremental rating fast path;
- editing/deleting/retroactive matches use full group rating recalculation;
- route transitions should prefer destination-context skeletons;
- feed event generation should be handled through per-event generators.

Future decision records should live under:

```txt
docs/architecture/adr/
```

Do not create ADRs for every small implementation detail. Use ADRs for decisions that affect architecture, product constraints, or future trade-offs.
