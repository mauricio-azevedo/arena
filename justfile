# Composite recipes only; per-package scripts stay in each package.json.
# `just --list` shows them.

# Fresh clone to ready: install, local env, database, Prisma client, migrations
setup:
    pnpm install --frozen-lockfile
    cp -n apps/api/.env.example apps/api/.env || true
    just db-up
    pnpm --filter @arena/api exec prisma generate
    just migrate-deploy

# API on :3000 and web on :3001, both with reload; Ctrl-C stops both
dev: db-up
    pnpm -r --parallel run dev

# Local PostgreSQL on localhost:5433, returns once it accepts connections
db-up:
    docker compose up -d --wait

# Apply pending migrations without prompting (CI and deploys)
migrate-deploy:
    pnpm --filter @arena/api exec prisma migrate deploy

# Everything CI runs, in CI order. Needs a migrated DATABASE_URL for e2e.
# Type-aware lint, unit tests and build all import the generated Prisma client.
ci:
    pnpm --filter @arena/api generate
    pnpm run format:check
    pnpm run lint:check
    pnpm -r run build
    pnpm --filter @arena/api test
    pnpm --filter @arena/api test:e2e
