# syntax=docker/dockerfile:1

# Image for @arena/api. The build context is the repo root, not this directory:
# `turbo prune` needs the workspace to resolve the API's internal dependencies.
#
#   just docker-build
#
# Four stages, each earning its place:
#   pruner     the smallest workspace that still builds the API
#   deps       install from manifests alone, so source edits reuse this layer
#   builder    @arena/contracts, the Prisma client, then `nest build`
#   prod-deps  the same install without devDependencies
# The runtime image copies from the last two and inherits no toolchain.

FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# Toolchain for bcrypt, the only dependency that compiles a native binding.
# Installing it twice (deps, prod-deps) keeps it out of the runtime image.
FROM base AS toolchain
RUN apt-get update \
  && apt-get install --no-install-recommends -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS pruner
COPY . .
# turbo's CLI only — pinned to the major, so a lockfile bump never touches this
# file. The pruned output format is stable within it.
RUN pnpm dlx turbo@2 prune @arena/api --docker

FROM toolchain AS deps
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY --from=pruner /repo/out/full/ .
# `prisma.config.ts` refuses to load without DATABASE_URL. `prisma generate`
# never connects, and the generated client does not depend on the value.
ENV DATABASE_URL=postgresql://unused:unused@127.0.0.1:5432/unused
RUN pnpm turbo run build --filter=@arena/api...

FROM toolchain AS prod-deps
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile --prod

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /repo/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=builder /repo/packages/contracts/package.json /repo/packages/contracts/
COPY --from=builder /repo/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /repo/apps/api/package.json /repo/apps/api/
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
USER node
WORKDIR /repo/apps/api
EXPOSE 3000
# Liveness only: `/health` answers without touching the database, the same split
# the hosted health checks use (`/health/ready` is the dependency probe).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT??3000)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/src/main.js"]
