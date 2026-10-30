---
status: accepted
date: 2026-10-16
---

# zod schemas in @arena/contracts as API request contract

## Context and Problem Statement

Request bodies typed inline in controllers, shape-checked imperatively in services; web re-declares
every request and response type by hand (`apps/web/src/types/api.ts`, feature `*.type.ts`); copies
drift (#267). Single source for the HTTP contract both apps compile against?

## Considered Options

- zod schemas in `@arena/contracts`, parsed at route, types inferred in both apps
- OpenAPI spec, generated web types
- Hand-mirrored TypeScript types (status quo)

## Decision Outcome

Chosen option: "zod schemas in `@arena/contracts`". One same-language consumer needs no spec; schema
is runtime check and type in one declaration. OpenAPI: second hand-synced mirror, no DTO classes for
`@nestjs/swagger` to introspect. Revisit on second consumer, then emit spec from schemas
(`zod-openapi`).

### Consequences

- Good, body validated once at route, service receives inferred type.
- Good, field change fails `tsc` in whichever app did not follow.
- Bad, each module's schema needs its own subpath export: root index bundled into web, CJS zod not
  tree-shakeable (64 locales, +95 kB gzipped per route).
- Bad, web form wanting a schema at runtime pays that bundle cost until package emits ESM.

## More Information

Implemented module by module from #267, matches first. Responses: ADR 0008.

Complete 2026-10-30 (#300): every route that takes a body parses it at the route, and no
`@Body()` is left without the pipe. The service-level shape checks the conversion replaced are
gone — the seventeen `BadRequestException`s left in `src/` are all rules (invite revoked, expired
or used up; a stub already claimed; a player appearing twice; an e-mail clash), which is the
division §3 of `backend-conventions.md` asks for.
