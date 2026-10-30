---
status: accepted
date: 2026-10-19
---

# zod codec schemas in @arena/contracts as API response contract

## Context and Problem Statement

ADR 0007 covers request bodies. Responses still hand-mirrored in the web (`types/api.ts`, ~28
types), and API returns `Date` where the wire carries an ISO string: one declaration cannot be
both apps' type. Single declaration per response, true on both sides, keeping 0007's OpenAPI
exit path?

## Considered Options

- zod codec schemas: `z.input` = wire (web), `z.output` = API return, dates via one
  `isoDateTime` codec
- TypeScript types in the package, web reads them through a `Serialized<T>` mapped type
- Wire types in the package, a mapper per route in the API

## Decision Outcome

Chosen option: "zod codec schemas". Both sides inferred from one declaration; `z.toJSONSchema(s,
{ io: 'input' })` emits the wire shape the day a second consumer wants a spec. Types +
`Serialized<T>` would mean rewriting every response that day. A mapper per route is runtime work
for a type problem.

### Consequences

- Good, `tsc` fails in whichever app drifts; the API annotates service returns with
  `z.output`, the web imports `z.input`.
- Good, one strict `parse` per route in e2e catches a field the API sends without promising it.
  Nothing parses in production.
- Good, contract = what the API sends minus internals: wire trimmed to it (match responses lost
  emails and processing fields).
- Bad, ~1.3× the characters of a plain type; dates must go through `isoDateTime`.
- Bad, JSON Schema emission must always use `io: 'input'`: `Date` has no JSON representation.

## More Information

Spike on zod 4.6.7, #293. Convention: `XResponse` = `z.output`, resource name = `z.input`, one
name when they coincide. Implemented module by module from #267, matches first.

Complete 2026-10-30 (#300). `apps/web/src/types/api.ts` and the feature `*.type.ts` mirrors are
deleted; every route but feed, processing and `/health` is parsed strict in
`app.e2e-spec.ts` (`backend-conventions.md` §10 says why those three are exempt), and a test in
the package renders every exported schema with `io: 'input'` so the emission path above stays
open while no consumer uses it.

Trimming the wire to the contract removed fields nobody had promised: the claim-email columns off
the member and ranking payloads, `_count` and the creator off group rows, the inviter's and the
claimer's e-mail off invites and claims, the processing internals off matches. One drift surfaced
on the way: `GUEST_TAKEN_OVER` was being written but was missing from the web's hand-mirrored
notification union, and crashed the card — the class of bug this ADR exists to end.

Open from here, each on its own trigger: ESM output for the package (unblocks client-side form
schemas without the CJS zod bundle, needs a Jest spike — the API tests `require` it); OpenAPI
emission, on a second consumer; a zod-free leaf module for the password and e-mail constants the
web still duplicates, since importing them today would pull zod into the bundle.
