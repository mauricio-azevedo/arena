# Arena — AI Collaboration Guide

This file gives AI agents the highest-level project instructions.

For substantial work, read and follow:

- `docs/ai/AI_WORKFLOW.md`
- `docs/ai/ARENA_CONTEXT.md`
- `docs/ai/AI_REVIEW_CHECKLIST.md`
- `docs/ai/PROMPT_PATTERNS.md`
- `docs/ai/RESEARCH_SOURCES.md`
- `docs/ai/AI_TENDENCIES_AND_GUARDRAILS.md`

## Default behavior

Do not make broad implementation changes immediately.

For non-trivial coding, architecture, product, or UI work:

1. Read relevant code first.
2. Research external references when useful.
3. Explain the current architecture or product behavior.
4. Map options and trade-offs.
5. Recommend one approach.
6. Propose a staged implementation plan.
7. Wait for approval before editing.
8. Implement small, reviewable changes.
9. Validate honestly.
10. Stop at checkpoints.

Never claim tests, build, lint, migrations, or deploy checks passed unless they actually ran.

---

# Arena — Product & UI Quality Bar

Treat every UI/UX decision as something that will be shipped to real users, not as a functional draft.

Before proposing or implementing any visible detail, ask:

> Would a mature production app ship this?

If the answer is not clearly yes, revise it before showing it.

This applies to copy, layout, navigation, loading states, empty states, error messages, success messages, button labels, route names, visual hierarchy, microinteractions, and transitional behavior.

Do not explain implementation to the user. Do not expose architecture, internal limitations, placeholders, "coming soon" labels without clear product intent, or text that only exists to justify the design. The interface should speak the language of the product, not the language of the developer.

Prefer simplicity and silence over unnecessary explanation. Every visible element must have a job: help the user understand, decide, act, or recover. If a text, button, state, or screen does not help the user, remove it.

Be self-critical. Do not rely on the user to review every detail. Before delivering UI/UX work, review it as product work:

- Does this feel final?
- Is this consistent with the rest of the app?
- Is this necessary?
- Does this create noise?
- Could this confuse the user?
- Does this reveal technical implementation?
- Is this elegant enough to ship?

If there is a conflict between "it works" and "it feels like a finished product," do not stop at "it works." Keep refining until it feels like a finished product.

## Quick checklist

Before shipping UI/UX, confirm:

1. The screen has a clear purpose.
2. The copy is short, human, and useful.
3. No text explains implementation or architecture.
4. No placeholder or temporary UI is visible.
5. Loading states, transitions, and empty states are intentional.
6. Navigation feels natural.
7. Error and success states are clear and actionable.
8. The result feels ready to ship without the user babysitting every detail.

---

# Arena — Code Quality Baseline

The product bar above applies to the code, too. Reuse, consistency, and completeness are the
floor, not an upgrade — never something the user should have to ask for. Before adding code, ask:

> Would a mature codebase merge this?

If not clearly yes, revise it before showing it. The recurring failure is shipping the easy half:
the second hand-rolled copy of something that already exists, or a component that only styles the
happy path. Hold yourself to:

- **Don't ship the second copy.** If the markup or logic already exists — or you're about to write
  it a second time — reach for the existing primitive or extract one. Match the established pattern
  instead of inventing a one-off next to it. One header action bar, one field, one submit flow.
- **Ship every state.** A shared component owns all the states it can be in — error, loading,
  empty, disabled, busy — not just the valid case. A field that styles only valid input, or a
  submit with no busy/error path, is unfinished. Build the error/empty/loading in once, in the
  shared piece, so every caller gets it for free.
- **Single-source derived UI.** Anything derived or repeated — labels, badges, avatars, a field's
  error treatment — lives in one helper/primitive, never re-inlined per screen. (See
  `frontend-conventions.md` §9.)
- **Extract on real reuse, not speculation.** Promote a helper/component on the second or third
  real use, not preemptively — "local by default, shared by necessity" (`code-organization.md`).
  DRY is about removing real duplication, not building frameworks for one caller.
- **You shouldn't need to be asked.** Treat DRY, consistency, and complete states as the minimum
  bar — apply them by default, the same way you wouldn't ship a broken layout.

## Quick checklist

Before finishing code, confirm:

1. This is the only copy of this markup/logic — nothing existing was duplicated.
2. The component handles every state it has: error, loading, empty, disabled, busy.
3. It reuses the existing primitive/pattern instead of a parallel one-off.
4. Derived or repeated UI is single-sourced.
5. No premature abstraction — nothing was "shared" for a single caller.

Known consistency debt to fold in when you touch the relevant files lives in
`docs/engineering/code-quality-backlog.md`.
