# Arena Context

This document gives AI assistants stable context about Arena.

It should stay concise and practical. Do not turn this file into full product documentation or a backlog.

## Product summary

Arena is a mobile-first web app for casual beach tennis groups.

It helps players create groups, invite friends, register doubles matches, track group-specific ratings, view rankings, follow activity, and build a personal sports history from casual games.

## Product positioning

Arena should feel:

- social, not bureaucratic;
- competitive, not intimidating;
- lightweight, not enterprise/team-management-heavy;
- trustworthy, especially around rankings and match history;
- polished enough to feel like a real product, not an internal admin tool.

## Core user questions

The product should help users answer:

- Which group deserves my attention now?
- Where am I competing?
- What changed since last time?
- What is my next action?
- Is the competition/ranking trustworthy?

## Stack

Frontend:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- shadcn/ui-style primitives;
- Lucide icons.

Backend:

- NestJS;
- TypeScript;
- Prisma;
- PostgreSQL;
- background processing jobs.

Deployment:

- Render;
- Prisma migrations must be deployed explicitly;
- Prisma client generation matters because generated client code is stored in the repo.

## Repository structure

```txt
arena/
  api/      NestJS backend
  web/      Next.js frontend
  docs/     product, engineering, architecture, QA, and AI workflow docs
```

## Domain model

Core entities:

- `User`: a real account in the system.
- `Group`: a social and sport context where matches happen.
- `GroupMember`: a user inside a group, including role and group-specific rating data.
- `Match`: a doubles match inside a group.
- `MatchPlayer`: a group member participating in a match.
- `FeedItem`: a persisted activity moment used to power the feed.

Important modeling decisions:

- ratings live on `GroupMember`, not directly on `User`;
- match participants store historical snapshots;
- feed items are persisted records, not only derived read-time projections;
- ranking/statistics are derived from active match history when appropriate.

## Architecture principles

- Keep read paths cheap.
- Treat ranking/statistics as derived state when appropriate.
- Prefer explicit projection services over hidden database triggers.
- Prefer idempotent rebuilds for derived group state.
- Keep API contracts stable and typed.
- Keep route files thin.
- Keep API calls out of rendering components.
- Keep code local until reuse is real.
- Avoid broad refactors during feature work.
- Document architectural, product, data model, API, or QA changes when they affect future work.

## Critical flows

### Groups

Groups are the main social and competitive container.

Group-related UI should communicate:

- group identity;
- member count;
- match activity;
- ranking status;
- the current user's position when available;
- the next useful action.

### Matches

Matches are the source of truth for competitive history.

Any feature derived from match history must consider:

- match creation;
- match updates;
- soft deletion;
- participant changes;
- winner changes;
- replay/rebuild behavior.

### Rankings

Rankings and ratings are competitive identity.

UI should avoid overexplaining rating math, but should make the competition feel trustworthy.

Ranking-related backend changes should consider:

- source of truth;
- derived state;
- idempotency;
- processing job order;
- read path cost;
- migration/deploy safety.

### Processing jobs

Processing jobs rebuild projections and keep derived state consistent.

Projection logic should be:

- explicit;
- idempotent;
- observable;
- easy to rebuild;
- easy to reason about during failures.

## UI principles

- Start from the user decision, not from the layout.
- A group card should answer: "Is this worth my click?"
- A group screen should answer: "What is happening here and what should I do now?"
- Do not add raw data unless it improves understanding, decision, action, or recovery.
- Prefer one strong hierarchy over several equal-weight tiles.
- Keep copy short, human, and product-facing.
- Do not expose implementation details to users.

## Product references to consider

Use these as inspiration, not as patterns to copy blindly:

- Strava: social competition, activity, leaderboard integrity.
- GameChanger: amateur sports, recaps, team/player stats.
- UTR: sport rating, confidence, match context.
- Chess.com: rating as competitive identity.
- Duolingo: lightweight progression and habit loops.
- TeamSnap: group organization and roster patterns.
- Discord/Reddit/Meetup: signs of active communities.

## Known AI failure modes in this repo

Avoid:

- producing large opaque PRs;
- over-abstracting UI too early;
- rewriting files unnecessarily;
- mixing feature, refactor, and redesign;
- not preserving existing repo patterns;
- claiming validation without running it;
- generating code that works in isolation but does not integrate with the current branch;
- making architectural decisions before the maintainer understands the trade-off.
