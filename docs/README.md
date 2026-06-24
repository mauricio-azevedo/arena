# Arena Documentation

This directory is the source of truth for Arena product, design, architecture, engineering, QA, operations, and security decisions.

The goal is to make the project easier to evolve without losing context in conversations, pull requests, or implementation details.

## Documentation map

### Product

Product docs describe what Arena should do and why.

- [`product/glossary.md`](product/glossary.md): domain vocabulary used across product, design, code, and QA.
- [`product/feed-events.md`](product/feed-events.md): feed event catalog, product rules, lifecycle, visibility, and metadata contracts.

### Design

Design docs describe how the product should feel and behave.

- [`design/loading-and-skeletons.md`](design/loading-and-skeletons.md): loading UX patterns, contextual skeletons, route transitions, and anti-patterns.
- [`design/spacing.md`](design/spacing.md): the 8-point grid and the semantic spacing ladder (`gap-snug`, `space-y-section`, …).

### Architecture

Architecture docs describe how the system is structured and why.

- [`architecture/system-architecture.md`](architecture/system-architecture.md): reverse-engineered, code-accurate runtime architecture (authoritative).
- [`architecture/overview.md`](architecture/overview.md): high-level system overview.
- [`architecture/data-model.md`](architecture/data-model.md): entities, relationships, cardinality, derived read models.
- [`architecture/feed-architecture.md`](architecture/feed-architecture.md): persisted feed event architecture.
- [`architecture/rating-architecture.md`](architecture/rating-architecture.md): rating snapshots and recalculation (math correct; execution model now async — see `system-architecture.md`).
- [`architecture/processing-jobs.md`](architecture/processing-jobs.md): in-database job queue and projection cascade.
- [`architecture/weekly-highlights.md`](architecture/weekly-highlights.md): home "Essa semana" highlights read model + projection.

### Engineering

Engineering docs describe how to work on the codebase.

- [`code-organization.md`](code-organization.md): file/folder organization rules for frontend and backend.
- [`engineering/backend-conventions.md`](engineering/backend-conventions.md): observed NestJS/API conventions and route map.
- [`engineering/frontend-conventions.md`](engineering/frontend-conventions.md): observed Next.js/web conventions.
- [`engineering/development-setup.md`](engineering/development-setup.md): local setup and development workflow.
- [`engineering/database.md`](engineering/database.md): database, Prisma, Neon, and migration guidance.
- [`engineering/database-reference.md`](engineering/database-reference.md): table/enum/index/migration reference mirroring the schema.

### QA

QA docs describe how to validate critical behavior.

- [`qa/critical-flows.md`](qa/critical-flows.md): manual regression checklist for the most important product flows.

## Documentation principles

1. **Product rules should be explicit.** If behavior matters to users, it should be documented in product docs, not only in code.
2. **Architecture decisions should explain trade-offs.** Future changes should understand why the current design exists.
3. **Contracts should be documented where they cross boundaries.** API responses, feed metadata, permission behavior, and persistence rules should be easy to verify.
4. **Design behavior should be consistent.** Navigation, loading, skeletons, empty states, and error states should not be reinvented per screen.
5. **Docs should be maintained as part of feature work.** A PR that changes product rules, architecture, permissions, data model, or critical UX should update docs.

## When to update docs

Update documentation when a change affects any of these areas:

- product behavior or business rules;
- feed events and metadata;
- rating/ranking calculation;
- auth, permissions, or access control;
- database schema or migration process;
- navigation, loading, skeleton, or key UI patterns;
- API contracts;
- critical QA flows;
- deployment, database reset, restore, or operational procedures.

## Future structure

This first documentation foundation intentionally starts with the highest-leverage docs. As the project grows, add more docs under these areas:

```txt
docs/
  product/
  design/
  architecture/
    adr/
  api/
  engineering/
  qa/
  operations/
  security/
```

Avoid creating empty placeholder files. Add a doc when there is real content or a real decision to preserve.
