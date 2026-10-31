# Composite recipes only; per-package scripts stay in each package.json.
# `just --list` shows them.

# Fresh clone to ready: install, local env, database, Prisma client, migrations
setup:
    pnpm install --frozen-lockfile
    cp -n apps/api/.env.example apps/api/.env || true
    just db-up
    pnpm turbo run generate
    just migrate-deploy

# API on :3000 and web on :3001, both with reload; Ctrl-C stops both.
# Shared packages build first, then rebuild on change.
dev: db-up
    pnpm turbo run dev

# Local PostgreSQL on localhost:5433, returns once it accepts connections
db-up:
    docker compose up -d --wait

# API container image. Context is the repo root: turbo prune needs the workspace.
docker-build:
    docker build -f apps/api/Dockerfile -t arena-api:local .

# Apply pending migrations without prompting (CI and deploys)
migrate-deploy:
    pnpm --filter @arena/api exec prisma migrate deploy

# Everything CI runs, in CI order. Needs a migrated DATABASE_URL for e2e.
# Turbo builds shared packages and the Prisma client before anything that imports them.
ci:
    pnpm run format:check
    pnpm turbo run lint:check build test
    pnpm run lint:docs
    pnpm turbo run test:e2e
