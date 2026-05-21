# BeachRank

BeachRank is a mobile-first web app for casual beach tennis groups.

It lets players create groups, invite friends, register doubles matches, track ratings, view rankings, follow recent activity, and build a personal sports history from casual games.

The goal is simple:

> Make casual beach tennis feel light like a game, but meaningful like a competition.

---

## What BeachRank is

BeachRank is not a tournament platform.

It is designed for the kind of beach tennis people actually play every week:

- casual groups;
- day-use games;
- rotating doubles;
- friendly competition;
- quick match registration after each game;
- local rankings inside each group;
- personal stats over time.

Instead of trying to manage courts, queues, or tournaments, BeachRank focuses on what happens after the match:

> record the result, update ratings, keep the history alive.

---

## Core product idea

Casual beach tennis usually has a lot of games, but very little memory.

People play, win, lose, improve, create rivalries, change partners, and move up or down in the group — but none of that is usually tracked.

BeachRank turns those games into:

- group rankings;
- match history;
- player ratings;
- personal stats;
- feed activity;
- lightweight social discovery.

---

## Current features

### Authentication

- User registration
- Login
- Token-based authenticated requests
- Logout on the frontend

### Groups

- Create groups
- View user groups
- Group memberships
- Admin/member roles
- Invite links
- Accept invite flow
- Group member ratings

### Matches

- Register doubles matches
- Store teams and score
- Save player snapshots per match
- Track rating before/after
- Track rating delta
- Edit/delete match support in the product direction
- Match history by group and by profile

### Rating

BeachRank currently uses a custom rating model inspired by Elo-style expected performance.

Each group member has a rating inside each group. A user's rating is not global because performance and context can vary between groups.

A match compares:

- average rating of Team A;
- average rating of Team B;
- expected result;
- actual score based on games won.

This means the system can reward performance, not only victory.

For example:

- losing 6–4 against a much stronger team can still be a good performance;
- winning 6–4 against a much weaker team may be below expectation;
- winning 6–0 against a weaker team confirms dominance.

### Feed

BeachRank has a feed system based on persisted `FeedItem`s.

Current feed concepts include:

- group created;
- member joined;
- feed item visibility;
- feed item scope;
- actor user;
- subject user;
- importance score;
- dynamic feed score based on recency.

The feed is not meant to be a raw activity log.

It is meant to show moments that make the product feel alive.

Examples of future feed items:

- close match;
- blowout;
- upset win;
- ranking movement;
- win milestones;
- match count milestones;
- weekly activity;
- personal records.

### Profile

The profile area is being built as a sports profile, not just an account page.

Current direction:

- profile header;
- summary tab;
- matches tab;
- groups tab;
- stats tab.

The summary tab includes:

- matches played;
- wins;
- losses;
- win rate;
- recent matches;
- recent groups.

---

## Product principles

BeachRank is being built around a few strong product principles.

### 1. Low friction first

The main real-world flow is:

match ends → someone registers the result → people keep playing

The app should not interrupt the game.

### 2. Social trust before heavy validation

In casual groups, social context matters.

The product should not start from fear of cheating. It should start from the behavior that makes people want to keep using it.

Validation, moderation, confirmations, and correction flows can evolve as the product grows.

### 3. Groups are the core context

A user is global.

A group member is the user inside a group.

A player in a match is a group member participating in that match.

This distinction matters because:

* ratings belong to group memberships;
* rankings are group-specific;
* matches happen inside groups;
* social context comes from shared groups.

### 4. Feed should show meaningful moments

The feed should not show everything.

It should show moments that create:

* recognition;
* progress;
* rivalry;
* social curiosity;
* motivation to play again.

### 5. Mobile-first

BeachRank is designed primarily for phone usage.

It should be usable in a beach tennis arena, between games, with minimum friction.

---

## Tech stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide icons

### Backend

* NestJS
* TypeScript
* Prisma
* PostgreSQL

### Infrastructure

* PostgreSQL locally via Docker
* Neon for production database
* Render for backend deployment
* Vercel for frontend deployment

---

## Repository structure

```txt
beachrank/
  api/
    prisma/
    src/

  web/
    src/
```

### Backend structure

```txt
api/src/
  auth/
  feed/
  group-invites/
  groups/
  matches/
  members/
  me/
  prisma/
  ranking/
  rating/
```

### Frontend structure

```txt
web/src/
  app/
  components/
  features/
  lib/
  types/
```

The frontend uses a feature-based organization.

Example:

```txt
features/profile/
  profile.tsx

  components/
  helpers/
  types/
  enums/

  tabs/
    summary/
    matches/
    groups/
    stats/
```

---

## Domain model overview

### User

A real account in the system.

A user can belong to many groups.

### Group

A social/sport context where matches happen.

Examples:

* Vila Beach
* Amigos do Beach
* Beach terça 19h

### GroupMember

A user inside a group.

This is where group-specific sports data lives:

* display name;
* role;
* rating;
* rating algorithm data;
* membership status.

### Match

A doubles match inside a group.

A match stores:

* group;
* score;
* winner team;
* expected result;
* actual result;
* rating before/after for teams;
* played date.

### MatchPlayer

A group member inside a match.

This stores the player's match-specific data:

* team;
* position;
* display name snapshot;
* rating before;
* rating after;
* rating delta.

### FeedItem

A persisted feed moment.

A feed item can represent group activity, user-level milestones, match highlights, or social discovery moments.

Current feed model supports:

* type;
* scope;
* visibility;
* group;
* actor user;
* subject user;
* match;
* metadata;
* importance score;
* occurrence date.

---

## Rating model

BeachRank currently uses a custom rating formula inspired by Elo.

### Team rating

```txt
teamRating = average(playerRatings)
```

### Expected score

```txt
expectedA = 1 / (1 + 10 ^ ((teamBRating - teamARating) / 400))
```

### Actual score

```txt
actualA = gamesA / (gamesA + gamesB)
```

### Rating delta

```txt
deltaA = K * (actualA - expectedA)
deltaB = -deltaA
```

Currently:

```txt
K = 32
initialRating = 1000
```

Both players on a team receive the same delta.

---

## Why score matters

BeachRank does not treat every win equally.

A 7–6 win and a 6–0 win communicate different things.

A weaker team losing 6–4 to a stronger team may have performed above expectation.

A stronger team winning only 6–4 against a much weaker team may have performed below expectation.

This helps the ranking feel more realistic in casual doubles.

---

## Feed model

The feed is based on saved `FeedItem`s instead of being derived only from raw database queries.

This allows the product to support:

* moments;
* milestones;
* ranking movement;
* social visibility;
* historical snapshots;
* future notifications;
* future personalized ranking of feed items.

### Feed item visibility

Current visibility concepts:

```txt
GROUP_MEMBERS
SOCIAL_CIRCLE
PUBLIC
PRIVATE
```

Examples:

```txt
MEMBER_JOINED
→ visible to group members

GROUP_CREATED
→ visible to the creator, members of the new group, and users who share a group with the creator
```

### Feed scoring

Feed order is not purely chronological.

The current business rule is:

```txt
feedScore = importanceScore + recencyScore
```

Where `importanceScore` comes from the event type, and `recencyScore` is calculated dynamically.

Example direction:

```txt
last 1h       +40
last 6h       +30
last 24h      +20
last 3 days   +10
older         +0
```

This prevents the feed from becoming either:

* a pure log;
* or a permanently importance-sorted list.

---

## Profile model

The profile is designed as a sports profile.

It is not just a settings page.

Recommended profile tabs:

```txt
Resumo
Partidas
Grupos
Estatísticas
```

### Summary tab

Shows:

* matches played;
* wins;
* losses;
* win rate;
* recent matches;
* recently played groups.

### Matches tab

Shows all user matches across all groups.

Each match can include:

* group;
* score;
* teams;
* result;
* rating before;
* rating after;
* rating delta.

### Groups tab

Should show all groups the user participates in.

Future useful data:

* rating per group;
* ranking position;
* total matches in group;
* last played date;
* role.

### Stats tab

Future detailed stats can include:

* win rate over time;
* matches per week;
* most frequent partners;
* most frequent opponents;
* best group by rating;
* current streak;
* best streak;
* match count milestones.

---

## API overview

The backend is organized around domain modules.

Main route groups include:

```txt
/auth
/groups
/groups/:groupId/members
/groups/:groupId/matches
/groups/:groupId/ranking
/groups/:groupId/invites
/invites
/feed
/me
```

Profile-related routes:

```txt
GET /me/profile
GET /me/profile/summary
GET /me/profile/matches
GET /me/profile/groups
GET /me/profile/stats
```

Some of these may still be under active implementation.

---

## Local development

### Requirements

* Node.js
* npm
* Docker
* PostgreSQL, or Docker Compose
* Prisma CLI through npm scripts / npx

---

## Environment variables

### Backend

Create `api/.env`:

```env
DATABASE_URL="postgresql://beachrank:beachrank@localhost:5433/beachrank"
JWT_SECRET="your-local-secret"
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

### Frontend

Create `web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

Adjust the API URL according to the local backend port.

---

## Running locally

### 1. Start the database

From the repository root or from the configured Docker directory:

```bash
docker compose up -d
```

### 2. Install backend dependencies

```bash
cd api
npm install
```

### 3. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start the backend

```bash
npm run start:dev
```

### 5. Install frontend dependencies

```bash
cd ../web
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

---

## Build

### Backend

```bash
cd api
npm run build
```

### Frontend

```bash
cd web
npm run build
```

---

## Database notes

The project uses Prisma with a generated client inside the backend source tree.

The Prisma generator outputs to:

```txt
api/src/generated/prisma
```

So imports should use the local generated client instead of assuming `@prisma/client`.

---

## UX direction

BeachRank should feel:

* mobile-first;
* calm;
* clean;
* fast;
* social;
* sporty;
* not administrative.

Avoid:

* excessive badges;
* heavy tables;
* long explanations in the UI;
* too many visible actions;
* desktop-first layouts;
* admin-panel feeling.

Prefer:

* cards;
* simple typography;
* subtle hierarchy;
* quick actions;
* short labels;
* clear match summaries;
* bottom navigation;
* compact mobile flows.

---

## Current navigation direction

The app navigation is moving toward:

```txt
Feed
Buscar
Grupos
Perfil
```

The bottom nav should use simple icons and avoid excessive labels if the visual language is clear.

---

## Roadmap

### Feed

* Add match highlight feed items

    * close match;
    * blowout;
    * upset win.
* Add ranking movement items.
* Add personal milestone items.
* Add weekly activity items.
* Add feed diversity rules.
* Add group feed.

### Profile

* Finish profile matches tab.
* Build groups tab.
* Build stats tab.
* Add profile-level milestones.
* Add public user profiles later.

### Groups

* Improve group home as a living group dashboard.
* Add group feed.
* Improve ranking view.
* Improve member list.
* Add better invite and admin flows.

### Search

* Search users.
* Search groups.
* Show active groups.
* Show groups where connected users play.

### Social graph

Possible future relationship models:

* shared groups as implicit social connection;
* friendship requests;
* follow system;
* suggested people;
* suggested groups.

### Rating

Possible future improvements:

* provisional rating state;
* rating deviation;
* volatility;
* better doubles modeling;
* rating confidence;
* decay/inactivity handling;
* historical rating charts.

---

## Important technical decisions

### Group-specific ratings

Ratings live on `GroupMember`, not directly on `User`.

This is intentional.

A player can perform differently in different groups, and each group has its own competitive context.

### Match player snapshots

Match participants store display name and rating snapshots.

This preserves historical match context even if names or ratings change later.

### Feed as persisted data

Feed items are stored as records instead of generated entirely on read.

This supports future features like:

* notifications;
* read state;
* feed ranking;
* visibility rules;
* event metadata;
* historical snapshots.

### Avoiding global rating for now

The profile does not show a single global rating.

A global rating could be misleading because ratings are group-specific.

A future global sports identity can be designed separately.

---

## Development philosophy

This project values code organization as part of product quality.

Preferred organization:

* feature-based;
* one concern per file;
* no large catch-all type files;
* no helper functions dumped inside large components;
* components separated from helpers, types, enums, and API calls;
* feature root component at the feature root;
* child components inside `components/`;
* tab-specific logic inside tab folders;
* shared profile logic at the profile feature root.

The goal is not to be minimal at all costs.

The goal is:

> simple product, serious codebase.

---

## Status

BeachRank is under active development.

The current focus is building the foundations of:

* feed;
* profile;
* group activity;
* match history;
* long-term sports identity.

The project is intentionally evolving toward a polished product, not just a demo.
