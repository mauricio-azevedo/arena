# Stub Players — "Jogadores sem conta"

> **Phase:** Product definition (concept). This document owns the *why*, the *experience*,
> and the *rules*. It does **not** describe implementation — the engineering plan lives
> separately and is disposable; this document is meant to outlive it.

A way to add someone to a group and start scoring them **right now**, without that
person needing an account, a phone, or an invite. You type a name; they're in.

## Problem

People play on a beach court, not at a keyboard. The person being added usually
doesn't have their phone in hand. Any flow that requires the new player to receive a
link, install the app, and sign up — before they can appear in a match — has already
failed the moment that matters: registering today's game.

The old model made "becoming a member" mean "owning an account," and gated it behind
an admin-only invite link. That's ceremony for the wrong moment.

## The reframe

**Adding a player does not require them to be a user of the app.** A member creates a
player profile on the spot — just a name — and that profile can immediately join
matches and the ranking. No phone, no login, no invite.

Account, login, and invites stop being the *entry* path and become an *upgrade* path:
when the person later wants their own account, they claim the stub profile and keep
all their history (matches, rating). That upgrade flow is **future work**, not part of
the first release.

## Who can do it

**Any active member**, not just admins. Creating a stub is low-risk and high-frequency
— the arena path. Heavyweight governance stays admin-only and is future work: linking a
stub to a real account, removing players, promoting, merging duplicates.

## The experience

The fastest add is the one that happens where you already are. The entry point is the
**player picker inside the match registration flow**:

- In a player slot, you search for a teammate by name.
- If no one matches, the same field offers **Criar "&lt;name&gt;"**.
- One tap creates the player and drops them straight into the slot and the group.

Because you can now build the roster while registering the first match, a brand-new
group with fewer than four members is no longer blocked from opening the match form.

A stub looks like any other player — name and avatar. There is **no "guest" badge**.
The only visible difference is that a stub's name isn't a link to a profile (there's no
account behind it yet). The distinction matters to an admin during the future upgrade
flow, not to everyone else day to day.

## Rules

- A stub has a name and no linked account. Its name is required and lives on the
  member itself; a real member's name always comes from their account.
- A stub participates fully in matches, ratings, and the group ranking, exactly like a
  real member.
- A stub has no personal home feed, so it never earns personal/weekly highlights.
- A stub's name is not a profile link anywhere it appears.

## Not in this release

- Claiming a stub: "Convidar para assumir este perfil" → link/QR → the person signs up
  and the stub's full history is preserved under their new account.
- Admin governance of stubs: merge duplicates, relink, promote, remove.
