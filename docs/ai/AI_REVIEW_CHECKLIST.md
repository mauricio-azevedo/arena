# AI Review Checklist

Use this checklist before accepting AI-generated changes.

The goal is not bureaucracy. The goal is to keep Arena maintainable, understandable, and shippable while still using AI for leverage.

## 1. Scope control

- Does the change solve exactly one problem?
- Did the assistant avoid unrelated refactors?
- Are all changed files expected for this task?
- Is the diff small enough to review carefully?
- Were feature work, cleanup, redesign, and generated files kept separate when possible?

## 2. Codebase fit

- Does the solution follow existing architecture?
- Does it reuse existing services, components, helpers, types, and patterns?
- Is this the only copy of the markup/logic — or was a near-duplicate inlined instead of using/extracting a shared primitive?
- Does each shared component ship every state it can be in (error, loading, empty, disabled, busy), not just the happy path?
- Are responsibilities placed in the right layer?
- Are names explicit and consistent with the repo?
- Did the assistant avoid creating abstractions before reuse was proven?

(Code Quality Baseline in `AGENTS.md`; tracked debt in `engineering/code-quality-backlog.md`.)

## 3. Product fit

- Does the change help a real user decision or action?
- Is the UX clearer rather than just busier?
- Does the copy match Arena's tone: social, competitive, lightweight, and polished?
- Does the UI hide implementation details from users?
- Did we avoid adding data that does not help understanding, decision, action, or recovery?

## 4. Data and backend correctness

For backend or data changes:

- Is the source of truth clear?
- Is derived data deterministic?
- Is the operation idempotent when jobs/retries/rebuilds are possible?
- Are create, update, delete, soft delete, and rebuild cases handled?
- Does the read path remain cheap?
- Are migrations safe for existing production data?
- Are generated Prisma files updated when the repo tracks them?

## 5. Security and permissions

- Are authorization checks explicit?
- Could a user access another group's data?
- Are admin/member permissions preserved?
- Are destructive actions guarded?
- Are uploads, secrets, tokens, and private data handled safely?
- Does the change introduce new abuse paths or trust assumptions?

## 6. Tests and validation

- What commands were run?
- What commands were not run?
- Were relevant build, lint, typecheck, unit, integration, or migration checks run?
- If automated tests do not exist, is there a manual QA plan?
- Did the assistant clearly avoid claiming validation it did not perform?

## 7. Deployment safety

- Does this require a database migration?
- Can old code run against new schema, or new code against old schema?
- Is rollback possible?
- Are environment variables or Render settings affected?
- Is runtime behavior different from build-time behavior?
- Are deployment commands documented when needed?

## 8. Observability

- Can we debug this if it fails?
- Are logs structured where background jobs, projections, or integrations are involved?
- Are failure cases visible?
- Is there a way to distinguish stale data from correct empty data?

## 9. Ownership

- Can the maintainer explain the change without rereading the entire diff?
- Are trade-offs documented?
- Are follow-ups separated from the current commit/PR?
- Did the assistant teach the model of the solution, not just produce code?

## Red flags

Do not accept the change without further review if:

- the assistant did not inspect relevant code;
- the diff is broad and hard to explain;
- tests/build are claimed but not actually run;
- the change introduces hidden coupling;
- an existing pattern was re-inlined instead of reused/extracted, or a component ships only the happy path (missing error/loading/empty/disabled/busy);
- UI was changed without explaining the user decision it serves;
- data logic was added without update/delete/rebuild reasoning;
- auth or permissions changed without explicit security review.
