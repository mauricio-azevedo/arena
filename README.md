# BeachRank

BeachRank is a full-stack web app for tracking casual beach tennis matches, player ratings, rankings, and match history.

The goal is to bring a lightweight “sports career” feeling to casual and amateur beach tennis: every registered match can affect a player’s rating and become part of their history.

## Current status

MVP in progress.

Currently implemented:

- Create players
- Register doubles matches
- Calculate player ratings after each match
- View ranking
- View match history
- Edit match support in progress
- Full rating recalculation after match changes

## Tech stack

### Backend

- NestJS
- Prisma
- PostgreSQL
- Docker
- Render

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Vercel

### Database

- PostgreSQL hosted on Neon

## Rating system

BeachRank uses a rating system inspired by Elo and tennis rating systems.

For each doubles match:

- Team rating is the average rating of both players
- Expected performance is calculated using an Elo-style formula
- Actual performance is based on games won / total games
- Rating change is calculated from the difference between actual and expected performance

```ts
expectedA = 1 / (1 + 10 ** ((teamBRating - teamARating) / 400))

actualA = gamesA / (gamesA + gamesB)

deltaA = 32 * (actualA - expectedA)
```

Current constants:

```ts
ELO_DIVISOR = 400
K_FACTOR = 32
INITIAL_RATING = 1000
```

These values are intentionally simple for the MVP and may be adjusted after testing with real match data.

## Rating recalculation strategy

When a match is created or edited, the system recalculates all player ratings from the full match history in chronological order.

This is intentional.

Rating changes are sequential, so editing an old match can affect every rating calculation after it.

For the MVP, full recalculation is simpler, safer, and easier to reason about than partial recalculation.

If needed later, this can be optimized with rating snapshots or recalculation from a specific match onward.

## Local setup

### 1. Clone the repository

```bash
git clone git@github.com:mauricio-azevedo/beachrank.git
cd beachrank
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Run the API

```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

API runs at:

```txt
http://localhost:3000
```

### 4. Run the web app

```bash
cd web
npm install
npm run dev
```

Web app runs at:

```txt
http://localhost:3001
```

## API endpoints

### Players

```txt
POST /players
GET /players
```

### Matches

```txt
POST /matches
GET /matches
PATCH /matches/:id
```

### Ranking

```txt
GET /ranking
```

## Roadmap

- Improve ranking with matches, wins, losses, and win rate
- Add match editing in the UI
- Add match deletion/correction flow
- Add player profile page
- Add mobile-first UI improvements
- Add authentication later if needed
- Add arena/group context later if real usage requires it

## Product principle

BeachRank prioritizes low-friction usage for casual players.

The app should feel light enough for day use, but meaningful enough to create history, rivalry, progression, and a sense of amateur sports career.