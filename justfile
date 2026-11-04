# Composite recipes only; per-package scripts stay in each package.json.
# `just --list` shows them.

# Name of this checkout, set only when it is a linked git worktree.
worktree := `if [ "$(git rev-parse --git-dir 2>/dev/null)" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then echo; else basename "$(git rev-parse --show-toplevel)" | tr -c '[:alnum:]\n' '_' | tr '[:upper:]' '[:lower:]' | cut -c1-50; fi`

# Database on the local server. Worktrees get one each, so two branches can hold different
# migrations at once; a plain clone keeps `arena`.
db := if worktree == "" { "arena" } else { "arena_" + worktree }

# Fresh clone to ready: install, local env, database, Prisma client, migrations, data
setup:
    pnpm install --frozen-lockfile
    just env-local
    just db-up
    pnpm turbo run generate
    just migrate-deploy
    just db-seed

# apps/api/.env from the example, pointed at this checkout's database
env-local:
    #!/usr/bin/env bash
    set -euo pipefail
    cp -n apps/api/.env.example apps/api/.env || true
    if [ -z "{{ worktree }}" ]; then exit 0; fi
    # Every tool reads this file, so the worktree's database is derived once, here. Prisma
    # creates it on the next `migrate deploy`; a non-local URL is left alone.
    sed -i -E '/^DATABASE_URL=.*localhost/ s|(postgresql://[^/"]+)/[^"?]*|\1/{{ db }}|' apps/api/.env

# API on :3000 and web on :3001, both with reload; Ctrl-C stops both.
# Shared packages build first, then rebuild on change.
dev: db-up
    pnpm turbo run dev

# Local PostgreSQL on localhost:5433, returns once it accepts connections
db-up:
    docker compose up -d --wait

# Discard this worktree's database once its branch is gone. The shared `arena` is never dropped.
db-drop:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -z "{{ worktree }}" ]; then
      echo "Not a worktree: this checkout shares the arena database, so there is nothing to drop." >&2
      exit 1
    fi
    docker compose exec -T postgres dropdb -U arena --if-exists --force "{{ db }}"

# API container image. Context is the repo root: turbo prune needs the workspace.
# One tag locally; CI passes the registry tags it then pushes.
docker-build +tags='arena-api:local':
    docker build -f apps/api/Dockerfile {{ prepend('-t ', tags) }} .

# Apply pending migrations without prompting (CI and deploys)
migrate-deploy:
    pnpm --filter @arena/api exec prisma migrate deploy

# Two groups of players with match history. Leaves a database that already has data alone.
db-seed:
    pnpm --filter @arena/api run db:seed

# Discard local data and seed it again
db-reseed:
    pnpm --filter @arena/api run db:seed -- --reset

# Everything CI runs, in CI order. Needs a migrated DATABASE_URL for e2e.
# Turbo builds shared packages and the Prisma client before anything that imports them.
ci:
    pnpm run format:check
    pnpm turbo run lint:check build test
    pnpm run lint:docs
    pnpm run knip
    pnpm turbo run test:e2e
