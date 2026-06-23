# Reivindicação de perfil — claiming a stub by email

> **Phase:** Product definition (concept). This document owns the _why_, the _experience_,
> and the _rules_ of the claim flow. It does **not** describe implementation — the
> engineering plan is separate and disposable; this document outlives it.
>
> Companion to [stub-players.md](./stub-players.md), which defines what a stub _is_. This
> doc defines how a stub becomes a real person's account.

A stub player (jogador sem conta) is a name someone typed on the court. **Claiming** is
how that name becomes a real person's account in the group — keeping every match, the
rating, and the ranking position the stub already earned.

## Why this matters

The stub got someone _scoring today_ — that was the urgent problem, and it's solved.
Claiming is the unhurried upgrade: the person later inherits the history they actually
played, without starting from zero or leaving a duplicate behind. Because the urgency is
already gone, claiming doesn't need to happen on the court — it can wait for a notification.

## The whole model: an admin anchors an email

There is **one** way to start a claim: **an admin attaches an email to the stub.** That's
the entire initiation surface — no links, no QR, no search, no approval workflow.

- The **email is the identity anchor.** Setting it is the admin vouching "this stub is
  whoever owns this email."
- When an account with that email **exists** (now or later), that person gets **one in-app
  notification** — "Você foi adicionado como {stub} em {grupo} — é você?".
- They open it, see the stub's history, and **confirm** ("Sou eu") or **decline** ("Não
  sou eu"). **It never auto-claims** — confirmation is always required.

So authorization is one direction: the admin vouches by email; the owner consents by
confirming. There is no two-sided approval to reconcile.

### Registered now vs. later — identical

- **Email already has an account** → notified the moment the admin sets it.
- **Email not registered yet** → it waits on the stub; the first time someone signs up
  with that email, they get the same notification. (Like inviting a teammate by email.)

Either way the person lands on the same confirm screen and the same two outcomes.

## What the person sees (confirm screen)

Reached from the notification. It answers "is this me?" before asking to commit:

- **Recognition first.** The stub's name, where it sits (position · rating · partidas), and
  its **last few matches** (partners and opponents) — so they confirm it's really their
  history before taking it.
- **Two buttons:** "Sou eu — assumir este perfil" and "Não sou eu".
- The screen is auth-gated and server-authorized by the viewer's email matching the stub's
  anchored email — only the right person can even load it.

## The two outcomes

- **Assumido (success).** The history is theirs; their real name replaces the stub name
  everywhere automatically. A confirmation shows the inherited position/rating/partidas and
  a way into the group. (If they weren't a member, they join as that profile; if they
  already were, the stub merges into their membership.)
- **Conflito (blocked).** If the person and the stub **ever shared a match** in the group,
  they're provably different people. **This is caught when the admin sets the email** — if
  the email belongs to a member who shared a match with the stub, the admin is blocked
  right there ("Fulano já jogou com/contra esse perfil") and the email isn't saved. A
  conflict can only otherwise appear in a narrow race (a match logged between set and
  confirm); then the confirm is refused, nothing changes, and the admins are notified.

> Why the block exists: matches reference the membership, and a person can't appear twice
> in the same match (`@@unique([matchId, groupMemberId])`). Merging would put them on both
> sides — impossible. See [stub-players.md](./stub-players.md#claiming-a-stub-the-upgrade-path).

## Admin side (managing the email)

From the stub's drawer ("Vincular conta"):

- **Set / edit** the email. Editing invalidates any outstanding offer for the old email —
  the email value itself is the authorization, so an old confirm simply stops working.
- **State is visible:** convite enviado (account exists) · aguardando alguém criar conta ·
  recusado (the person said it's not them — the email is kept so it isn't silently re-sent,
  and the admin can change it).
- **Decline notifies the admins** so they can pick a different email.

In-app **notifications** are the only surface (a bell with an unread dot, a Notificações
screen). No email/push delivery — in-app only.

## Rules that don't bend

- **Never auto-link.** A stub's history only transfers with the admin's vouch (the email)
  **and** the owner's confirmation. Both are required.
- **Only admins** anchor an email to a stub.
- **One anchored email per stub** (per group). The email is the offer's nonce.
- The **shared-match block is absolute** — never overridden, by anyone. Fixing it means
  fixing the mis-logged match, not forcing the claim.
- A claim is irreversible from the product's point of view (no "un-claim" in the UI).

## Not in this concept

- On-court, zero-knowledge handoff (the old QR/link). Deliberately dropped: stubs already
  handle "score them now", so claiming can wait for an email — if the admin doesn't know
  the email, they ask. Links/QR, the request/approval workflow, admin direct-claim, and
  user search were all removed in favor of this single model.
- Reconciling two real memberships that already shared a match — out of scope, as in
  [stub-players.md](./stub-players.md).
- Email / push delivery of notifications — in-app only.

## Accepted limitation: the anchor is a mutable, unverified email

Authorization binds to the account whose email **equals** the anchored email, and account
emails are editable (with no verification step). So a known, accepted edge: if the intended
owner changes their account email after being anchored, their pending offer goes stale
(they stop matching and see "não disponível"); and the freed old email could later be
registered by someone else, who would then be offered — and could confirm — that stub's
history. Accepted because the blast radius is low (a casual group's match history for a
not-yet-claimed player) and email verification is deliberately out of scope. Recorded so it
isn't re-discovered as a bug — closing it would need email verification, or invalidating a
stub's anchor when an account's email changes.
