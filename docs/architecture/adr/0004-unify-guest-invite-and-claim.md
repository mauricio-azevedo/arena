# ADR 0004: One group link, person self-identifies (unify invite + claim)

## Status

Proposed — not yet implemented.

The product concept lives in
[`../../product/guests-and-invites.md`](../../product/guests-and-invites.md). The current
codebase still implements the email-anchored claim this ADR supersedes.

## Context

How a person comes to be represented in a group was split across three concepts that did not
connect:

- **Stub** — a `GroupMember` with `userId = null`, a name typed on the court so someone can be
  scored today without an account.
- **GroupInvite** — a generic link that only _joins_ the group as a brand-new member.
- **Email-anchored claim** — a separate flow where an admin anchors an email to a stub and the
  email's owner confirms to take it over.

Two front doors (the generic invite and the typed-on-court stub) could represent the same real
person twice. Reconciling them required a **merge**, which is the expensive, partly-blocked
operation: it re-points match history and is refused when the two memberships ever shared a
match (`@@unique([matchId, groupMemberId])` makes the same person appearing twice in one match
impossible). Duplicates were designed in; merge existed only to clean up after them.

The claim's identity anchor — an **email** set by an admin — was **mutable and unverified**: a
stale offer if the owner changed their email, and a freed email could later be registered by
someone else. We also considered an admin **user search** plus **per-guest bearer links**; both
put the admin in the middle of asserting who a player is, which they often can't do reliably and
which is ceremony for a casual group.

## Decision

Collapse invite and claim into **one group link**, and move identification to **the person**.

A player (`GroupMember`) exists the moment a name is typed; its only account-related states are
**unclaimed** and **claimed**. The group has **one shareable link / QR**. On open, the person
authenticates (or signs up) and is asked **"which of these players are you?"** against the list
of unclaimed guests:

- **Picks themselves** → recognition screen → **takes over** that guest instantly and inherits
  its history.
- **Not in the list** → **joins directly** as a new member, no approval.

Concretely:

- **Remove** the email anchor, the admin user search, and per-guest bearer links. There is **one
  group link** and **no pending/declined/invited state** on a guest.
- **Self-identification is the consent**; the **shared-match block** is the hard auto-reject; the
  **admin is notified** of every take-over and can **revert** it.
- **`stub` is renamed `guest`** (convidado) across product and code.

## Consequences

### Positive

- **Duplicates are avoided at the source.** The person picks their existing guest instead of
  creating a second membership, so merge becomes a rare exception rather than the norm.
- **The mutable, unverified email anchor disappears**, and so does the whole per-guest invite
  state machine and its notifications — **less UI than today**, not more.
- **One entry surface and no admin gatekeeping** on the happy path: open the link, say who you
  are, you're in.

### Negative / trade-offs

- **The unclaimed list is visible to any authenticated link-holder, and take-over is
  self-served.** Impersonation is bounded by the shared-match block, the admin notification
  (actionable — revert in one tap), and admin revert — **accepted for small, trusted groups.**
  The worst case (an impostor takes a high-ranked guest, leaving the real owner to join as a
  duplicate) is **recoverable** via admin revert + merge, not prevented. Identity verification
  stays out of scope.
- **A narrow race-duplicate is accepted:** someone joins as new just before being typed as a
  guest on court; resolved by merge later, not prevented.
- **The single link is unrevocable for now** — if it leaks, anyone with it can join. Link
  rotation is future work.
- **Requires a migration** when implemented: drop `claimEmail` / `claimEmailStatus` /
  `claimEmailNotifiedAt` and the registration hook, retire the `CLAIM_OFFER*` notifications, and
  build the group-link self-identification step plus admin revert / delete-guest controls.

## Supersedes

The email-anchored claim model — currently described in
[`../data-model.md`](../data-model.md) ("Email-anchored claim") and
[`../../engineering/database-reference.md`](../../engineering/database-reference.md) — and the
former `stub-players.md` + `profile-claim.md` concept docs, now consolidated into
[`../../product/guests-and-invites.md`](../../product/guests-and-invites.md). It also supersedes
the intermediate redesign sketch (admin user search + per-guest bearer links) considered earlier
in the same effort.
