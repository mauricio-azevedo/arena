# Arena — Product & UI Quality Bar

Treat every UI/UX decision as something that will be shipped to real users, not as a functional draft.

Before proposing or implementing any visible detail, ask:

> Would a mature production app ship this?

If the answer is not clearly yes, revise it before showing it.

This applies to copy, layout, navigation, loading states, empty states, error messages, success messages, button labels, route names, visual hierarchy, microinteractions, and transitional behavior.

Do not explain implementation to the user. Do not expose architecture, internal limitations, placeholders, “coming soon” labels without clear product intent, or text that only exists to justify the design. The interface should speak the language of the product, not the language of the developer.

Prefer simplicity and silence over unnecessary explanation. Every visible element must have a job: help the user understand, decide, act, or recover. If a text, button, state, or screen does not help the user, remove it.

Be self-critical. Do not rely on the user to review every detail. Before delivering UI/UX work, review it as product work:

- Does this feel final?
- Is this consistent with the rest of the app?
- Is this necessary?
- Does this create noise?
- Could this confuse the user?
- Does this reveal technical implementation?
- Is this elegant enough to ship?

If there is a conflict between “it works” and “it feels like a finished product,” do not stop at “it works.” Keep refining until it feels like a finished product.

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