# AI Tendencies and Guardrails

This document records recurring AI failure modes and the guardrails that should prevent them when working on Arena.

The goal is not to distrust AI by default. The goal is to use AI with the right controls: research, planning, small diffs, validation, and human ownership.

## Core rule

AI output should be treated as a high-speed draft that still needs grounding, review, and validation.

For important decisions, the assistant must separate:

- fact;
- source-supported claim;
- repo observation;
- inference;
- recommendation.

## Evidence anchors to revisit

Use these sources when updating this file:

- OpenAI notes on sycophancy and model behavior.
- Anthropic Claude Code best practices.
- OpenAI Codex and `AGENTS.md` best practices.
- GitHub Copilot prompt engineering and code review guidance.
- Empirical studies on AI coding assistants and integration failures.
- Empirical studies on AI-generated code security.
- Empirical studies on prompt management and agent instruction files.

## 1. Sycophantic agreement

Where it appears:

- Product direction;
- architecture decisions;
- code review;
- debugging;
- evaluating the maintainer's proposed approach.

Common triggers:

- The user proposes a solution confidently.
- The user asks, "does this make sense?"
- The user expresses a strong preference.
- The assistant is trying to be helpful or agreeable.

Failure pattern:

The assistant validates the user's framing too quickly, underplays alternatives, and turns a hypothesis into a recommendation.

Guardrails:

- Evaluate the proposal instead of agreeing by default.
- State what is good, what is risky, and what is missing.
- Offer at least one plausible alternative when the decision is non-trivial.
- Say when a direction is probably wrong or premature.

Validation:

- The response includes trade-offs, not only affirmation.
- The recommendation is tied to Arena's current context.
- The maintainer understands why the chosen direction beats alternatives.

## 2. Hallucinated certainty

Where it appears:

- Framework behavior;
- APIs;
- package names;
- CLI commands;
- deploy instructions;
- codebase facts;
- product references.

Common triggers:

- The assistant answers from memory.
- The task depends on current framework/tool behavior.
- The assistant saw similar APIs in other projects.
- The source context is missing or stale.

Failure pattern:

The assistant states uncertain or invented information with a confident tone.

Guardrails:

- For current tool behavior, use official docs or inspect the repo.
- For codebase facts, read the file before stating the fact.
- Label uncertainty explicitly.
- Do not invent package names, methods, flags, or config keys.

Validation:

- Tool behavior is supported by official docs or repo scripts.
- Codebase claims cite or reference inspected files.
- Unverified claims are marked as assumptions.

## 3. Source misuse in online research

Where it appears:

- Product research;
- UI inspiration;
- framework recommendations;
- security guidance;
- AI workflow research.

Common triggers:

- Mixed source quality in search results.
- Outdated framework articles.
- Opinion blogs that sound authoritative.
- Visual galleries being used as UX evidence.

Failure pattern:

The assistant treats all sources as equally authoritative or cherry-picks sources that support the initial answer.

Guardrails:

- Use official docs for tool behavior.
- Use empirical studies for observed AI failure modes.
- Use product references for inspiration, not proof.
- Use visual galleries for visual language, not strategy or accessibility.
- Compare sources when claims are high-impact or conflicting.

Validation:

- The answer explains source quality.
- The recommendation says what applies to Arena and what does not.
- The assistant does not use a weak source as a strong authority.

## 4. Code integration gap

Where it appears:

- Feature implementation;
- refactors;
- generated tests;
- API integration;
- dependency usage.

Common triggers:

- The assistant writes code before reading enough surrounding code.
- The task is familiar in general but not in this repo.
- The assistant follows common framework patterns that differ from Arena's patterns.

Failure pattern:

The code is plausible in isolation but does not integrate with the current codebase, branch, contracts, imports, generated types, or conventions.

Guardrails:

- Read relevant files before editing.
- Identify existing patterns and boundaries.
- Use the smallest diff that fits the current architecture.
- Re-read changed files after editing.
- Prefer repo conventions over generic best practices.

Validation:

- Changed files are expected for the task.
- The diff is small and cohesive.
- Imports, types, commands, and generated files match the repo.
- The maintainer can explain the change.

## 5. Validation theater

Where it appears:

- Build/test summaries;
- PR summaries;
- debug fixes;
- deploy instructions;
- generated tests.

Common triggers:

- The assistant wants to close the task.
- Tests cannot be run in the environment.
- The assistant infers that a change should compile.

Failure pattern:

The assistant implies validation happened or overstates confidence when no command actually ran.

Guardrails:

- Never claim build, lint, tests, migrations, or deploy checks passed unless they actually ran.
- State what was run and what was not run.
- Provide exact validation commands when commands cannot be run.
- Treat generated tests as code that also requires review.

Validation:

- The summary distinguishes executed checks from recommended checks.
- The maintainer can reproduce validation locally.

## 6. Scope creep and invisible architecture

Where it appears:

- UI revamps;
- refactors;
- architecture changes;
- feature work mixed with cleanup.

Common triggers:

- Broad requests like "make it better" or "modernize this".
- The assistant sees nearby cleanup opportunities.
- The assistant optimizes for impressive output rather than reviewability.

Failure pattern:

The assistant makes multiple decisions inside one patch, creating a diff that is hard to review and harder for the maintainer to own.

Guardrails:

- Map the solution first.
- Split work into staged changes.
- Keep one logical concern per commit.
- Do not mix feature, redesign, refactor, and cleanup unless explicitly approved.

Validation:

- The diff can be described in one sentence.
- Every changed file is justified by the approved scope.
- Follow-ups are listed separately.

## 7. Pattern matching superficial

Where it appears:

- Design patterns;
- architecture decisions;
- refactoring;
- backend boundaries;
- React component architecture.

Common triggers:

- The user asks about patterns, clean code, scalability, or architecture.
- The assistant sees terms like Strategy, Adapter, CQRS, Projection, Facade, or State Machine.

Failure pattern:

The assistant maps the problem to a known pattern too early and adds indirection before proving the problem exists.

Guardrails:

- Describe the concrete problem first.
- Compare simple implementation vs pattern.
- Use the pattern only if it removes more complexity than it adds.
- Do not rename simple code to match a pattern.
- Prefer Arena's existing conventions over textbook purity.

Validation:

- The simpler option and its limits are documented.
- The chosen pattern reduces responsibilities or risk.
- The maintainer can explain why the simpler option is insufficient.

## 8. Product/UI aesthetic mimicry

Where it appears:

- UI redesign;
- home/cards;
- dashboards;
- empty states;
- visual polish.

Common triggers:

- The assistant searches Dribbble, Behance, or other visual galleries.
- The user asks for a modern, premium, Apple-like, or polished UI.

Failure pattern:

The assistant copies surface aesthetics without understanding the user decision, flow, accessibility, information hierarchy, or product context.

Guardrails:

- Start from the user decision: what should the user understand, decide, do, or recover from?
- Use real product flows before concept art when possible.
- Check UX/accessibility references separately from visual galleries.
- Keep copy product-facing, not implementation-facing.
- Do not add visual density unless it improves decision-making.

Validation:

- The UI answers a concrete user question.
- Loading, empty, error, and success states are intentional.
- The main action is clear.
- The result feels shippable without exposing implementation details.

## 9. Data stuffing and dashboard inflation

Where it appears:

- Cards;
- rankings;
- dashboards;
- group screens;
- stats features.

Common triggers:

- The assistant finds many available fields.
- Product references show rich sports dashboards.
- The user asks for more context or more stats.

Failure pattern:

The assistant adds more data instead of better signals, increasing cognitive load and weakening the primary decision.

Guardrails:

- Prefer signals over raw data.
- For each metric, ask: what decision does this support?
- Delay advanced stats until there is enough match volume.
- Keep cards scannable; put detail on detail screens.

Validation:

- The card answers "is this worth my click?"
- The group screen answers "what is happening here and what should I do now?"
- Each visible metric has a job.

## 10. Security underweighting

Where it appears:

- Auth;
- permissions;
- invites;
- uploads;
- tokens;
- private data;
- admin actions;
- destructive actions.

Common triggers:

- The code path looks simple.
- The UI works in the happy path.
- The assistant focuses on functionality first.

Failure pattern:

The assistant produces working code but misses authorization, input validation, abuse cases, token handling, or privacy boundaries.

Guardrails:

- Security-sensitive work requires explicit security review.
- Use OWASP and official provider docs.
- Check group membership and admin/member permissions explicitly.
- Do not rely on AI code review alone for security.
- Do not log secrets, tokens, or private data.

Validation:

- Authorization is clear in the code path.
- Cross-group access is considered.
- Destructive actions are guarded.
- Uploads, tokens, and private fields are handled deliberately.

## 11. Package and dependency hallucination

Where it appears:

- Installing packages;
- imports;
- CLI examples;
- library APIs;
- generated code.

Common triggers:

- The assistant remembers a similar package.
- The package ecosystem has many lookalike names.
- The implementation reaches for a new dependency too quickly.

Failure pattern:

The assistant invents or suggests the wrong package, API, import path, or command.

Guardrails:

- Prefer existing dependencies.
- Verify package names and docs before recommending install.
- Ask before adding dependencies.
- Check the repo's package files before using a library.

Validation:

- The dependency already exists or was explicitly approved.
- The import path exists.
- The package is from a trusted source.
- The lockfile impact is understood.

## 12. Deploy and migration confusion

Where it appears:

- Prisma migrations;
- generated clients;
- Render deploys;
- env vars;
- build/start commands;
- runtime errors after merge.

Common triggers:

- The assistant assumes build commands also run release commands.
- The assistant does not inspect package scripts.
- The assistant confuses local dev, CI, and production.

Failure pattern:

The assistant gives deploy advice that mixes build, release, and runtime; forgets migration ordering; or assumes generated files are handled automatically.

Guardrails:

- Inspect package scripts and deployment docs.
- Separate build, release/migration, and runtime.
- State migration ordering explicitly.
- State whether generated files are committed or generated during build.
- Include rollback and validation.

Validation:

- Commands are exact.
- The migration state can be checked.
- The app can start after migration.
- The rollback path is known.

## 13. Context drift and stale conversation memory

Where it appears:

- Long conversations;
- multi-step implementation;
- repeated planning sessions;
- post-merge fixes.

Common triggers:

- The conversation becomes long.
- The assistant relies on memory instead of current files.
- The branch changes while the assistant still reasons from older context.

Failure pattern:

The assistant applies stale assumptions, misses current branch state, or repeats decisions that are no longer valid.

Guardrails:

- Re-read current files before implementation and debugging.
- Summarize stable decisions into docs.
- Treat current repo state as source of truth.
- Use checkpoints to refresh context.

Validation:

- Claims about code are grounded in current files.
- The assistant can name the current files and contracts it inspected.
- Recurring workflow decisions are moved into docs instead of relying on chat memory.

## 14. Finish-at-all-costs behavior

Where it appears:

- Debugging;
- implementation;
- migrations;
- UI polish;
- fixing failed builds.

Common triggers:

- The assistant is asked to continue quickly.
- A patch partially works.
- The assistant tries to avoid saying it is blocked.

Failure pattern:

The assistant keeps making changes without stopping to verify assumptions, ask for approval, or admit uncertainty.

Guardrails:

- Stop when the problem category changes.
- Stop when a fix requires a new architectural decision.
- Stop when validation cannot be performed and risk is material.
- Ask for approval before expanding scope.

Validation:

- The assistant pauses at checkpoints.
- The final answer includes unresolved risks.
- The assistant does not hide uncertainty behind confident prose.

## Maintenance rules

Update this file when:

- the assistant repeats a failure mode;
- a review catches a recurring AI mistake;
- a source reveals a new failure pattern relevant to Arena;
- a guardrail proves useful in practice;
- a guardrail is too vague to change behavior.

Remove or rewrite rules that do not change behavior.

This document should stay operational: each tendency should produce a concrete guardrail and a validation signal.
