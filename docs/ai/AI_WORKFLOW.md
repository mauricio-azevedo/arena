# AI Workflow

This document defines how AI assistants should help with Arena from ideas to code while preserving codebase ownership, architecture quality, and reviewability.

## Core principle

Do not let AI make architectural decisions faster than the maintainer can understand, review, and absorb them.

AI is useful for speed, research, synthesis, implementation support, and review. It must not replace product judgment, architectural ownership, or code review.

## Default mode: senior pair

For non-trivial work, the assistant must:

1. Read the relevant code first.
2. Research external references when the problem benefits from current or domain-specific knowledge.
3. Explain the current architecture or product behavior.
4. Map the main solution options.
5. Compare trade-offs and failure modes.
6. Recommend one approach for Arena's context.
7. Propose a staged implementation plan.
8. Wait for approval before editing code.
9. Implement one small step at a time.
10. Re-read changed files, summarize the diff, and state validation status.

## Work modes

### Exploration mode

Use for product ideas, UI direction, architecture uncertainty, unfamiliar domains, and open-ended decisions.

The assistant should:

- research relevant references;
- inspect the current product/code when applicable;
- explain what category of problem this is;
- map solution directions;
- recommend a direction;
- explicitly say what should not be done yet;
- avoid editing code.

### Architecture mode

Use for schema changes, API contracts, jobs, auth, permissions, migrations, storage, caching, deploy, and other decisions that can create long-lived coupling.

The assistant should:

- identify source of truth;
- identify read paths and write paths;
- consider idempotency, transactions, migration safety, rollback, and observability;
- prefer simple, explicit boundaries;
- avoid hidden behavior such as triggers unless intentionally chosen;
- propose reviewable implementation stages.

### Implementation mode

Use only after the direction and scope are approved.

The assistant should:

- touch the fewest files possible;
- preserve existing patterns;
- avoid unrelated refactors;
- keep one logical concern per step;
- stop after each checkpoint;
- state what was changed and why.

### Debug mode

Use when there is a build error, failed deploy, runtime error, or production issue.

The assistant should:

- inspect the current version of the relevant files;
- identify the actual contract that was broken;
- avoid superficial workarounds;
- produce the smallest safe fix;
- state exactly how to validate the fix.

### Review mode

Use after code is written.

The assistant should review:

- scope control;
- architecture fit;
- product behavior;
- data correctness;
- security and permissions;
- tests and validation;
- deploy risk;
- what the maintainer must understand to own the change.

## Approval rules

The assistant must ask before:

- adding dependencies;
- changing database schema;
- changing API contracts;
- changing auth, permissions, or security behavior;
- changing deploy/runtime behavior;
- broad refactors;
- deleting code or data;
- creating abstractions that affect multiple features.

## Validation rules

The assistant must be explicit about validation.

Never claim that tests, build, lint, migrations, or deploy checks passed unless they actually ran.

When validation cannot be run, the assistant must say so and provide the exact commands the maintainer should run.

## Commit and PR rules

Before creating a branch, the assistant must confirm the current tip of the repository's default branch and create the work branch from that exact updated `main` state. Do not use commit search results, stale SHAs, previous PR heads, or inferred branch tips as branch bases.

Prefer:

- one logical change per commit;
- small, reviewable diffs;
- feature work separated from cleanup;
- backend and frontend split when the boundary is clean;
- documentation updates when architectural, product, data model, API, or QA behavior changes.

Avoid:

- broad "make it better" changes;
- mixed feature + refactor + redesign diffs;
- generated code unless it is required and understood;
- hidden architectural decisions inside implementation commits.

## Research rules

Research online when:

- framework behavior may have changed;
- the task involves current documentation or deploy behavior;
- the problem is security-sensitive;
- product/UI references would improve judgment;
- the solution space is unfamiliar.

Research the repository when:

- changing any code;
- changing architecture;
- changing API contracts;
- changing UI that depends on existing design patterns;
- changing database schema or migrations;
- fixing a post-merge or production issue.

## Anti-patterns

Avoid:

1. Implementing immediately without reading the code.
2. Producing a large PR with invisible architectural decisions.
3. Creating abstractions before the shape has stabilized.
4. Fixing errors without understanding the broken contract.
5. Claiming validation that did not run.
6. Applying generic best practices against Arena's context.
7. Mixing redesign, refactor, and feature work.
8. Taking architectural decisions the maintainer cannot explain afterward.
9. Letting the conversation grow without compacting decisions into docs.
