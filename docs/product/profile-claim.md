# Reivindicação de perfil — claiming a stub

> **Phase:** Product definition (concept). This document owns the *why*, the *experience*,
> and the *rules* of the full claim flow. It does **not** describe implementation — the
> engineering plan is separate and disposable; this document outlives it.
>
> Companion to [stub-players.md](./stub-players.md), which defines what a stub *is*. This
> doc defines how a stub becomes a real person's account.

A stub player (jogador sem conta) is a name someone typed on the court. **Claiming** is
how that name becomes a real person's account in the group — keeping every match, the
rating, and the ranking position the stub already earned.

## Why this matters

The stub got someone *scoring today*. Claiming is the upgrade path: the person shows up
later, wants their own account, and should inherit the history they actually played —
not start from zero, and not leave a duplicate behind.

## The two routes in

There is exactly one thing that authorizes a claim: **proof you're the right person**.
That proof comes in one of two shapes.

1. **Link / QR (immediate).** A member opens the stub's drawer and hands the person a
   single-use link or QR. Possessing the link *is* the authorization — the group vouched
   by giving it to you. The person opens it and claims on the spot. This is the common,
   on-the-court path and it exists today.
2. **Request → admin approval (when there's no link).** The person finds the stub in the
   group but has no link, so they *ask*. Any group admin gets a notification, reviews, and
   approves or declines. Approval runs the exact same claim. *(Net-new; later phase.)*

An **admin** never needs to wait: from the stub's drawer they can claim a stub onto a
chosen account directly, or send that account an in-app invite to claim. *(Later phase.)*

## What the person sees (the claim page)

Opening a claim link lands on a single focused screen that answers "is this me?" before
asking to commit:

- **Recognition first.** The stub's name, where it sits (position · rating · partidas),
  and its **last few matches** (with partners and opponents) — so the person confirms
  this is really their history before taking it.
- **State-aware action:**
  - **Logged out** → "Criar conta e assumir" / "Já tenho conta" (returns here after auth).
  - **Logged in, not in the group** → a clean take-over: "Sou eu — assumir perfil". They
    join the group as that profile.
  - **Logged in, already in the group** → a **merge**: a stub → you preview, then "Assumir
    perfil". Their two profiles in the group become one.
- **An out:** "Não sou {nome}" always lets the wrong person leave without doing anything.

## The two outcomes

- **Assumido (success).** The history is now theirs. Their real name replaces the stub
  name everywhere automatically. A confirmation shows the inherited position/rating/
  partidas and a way into the group.
- **Conflito (blocked).** If the person and the stub **ever shared a match** in the group
  (partners *or* opponents), they're provably different people — one can't be the other.
  The claim is refused and **nothing changes**. This is not an error to hide: the screen
  *shows the shared match(es)* — teams, scores, the two highlighted names — so the reason
  is self-evident, and offers admin contacts in case a match was logged by mistake.

> Why the block exists: matches reference the membership, and a person can't appear twice
> in the same match (`@@unique([matchId, groupMemberId])`). The merge would have to put
> them on both sides — impossible. See [stub-players.md](./stub-players.md#claiming-a-stub-the-upgrade-path).

## Approval side (later phase)

When a claim is *requested* rather than linked:

- **Admins are notified** ("{pessoa} quer assumir o perfil {stub}"). The system has
  already checked the shared-match conflict, so the admin only confirms — the review
  screen states plainly whether it's safe.
- **Approve** runs the same claim/merge on the requester's behalf; **decline** leaves the
  stub untouched. Either way the requester is **notified** of the result.
- In-app **notifications** are the surface for all of this (a bell with an unread dot, a
  Notificações screen). There is no email/push — in-app only.

## Rules that don't bend

- A claim is irreversible from the product's point of view (no "un-claim" in the UI).
- The shared-match block is absolute — never overridden, by anyone, including admins.
  Fixing it means fixing the mis-logged match, not forcing the merge.
- Possessing a valid single-use link is sufficient authorization for a non-admin to claim
  without approval; approval only exists for the *no-link* request path.

## Not in this concept

- Reconciling two real memberships that already shared a match (would need history
  surgery) — out of scope, same as in [stub-players.md](./stub-players.md).
- Email / push delivery of notifications — in-app only.
