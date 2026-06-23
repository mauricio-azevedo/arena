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

## Claiming a stub (the upgrade path)

When the person wants their own account, they **take over** the stub and keep all its
history — same matches, same rating, same ranking position.

- **Trigger:** any member opens the stub's profile and generates a **single-use
  link/QR** ("Convidar para assumir este perfil"), then hands it to the person. The
  social trust already exists — you give the link to the right player.
- **Taking over:** the person opens the link, logs in or creates an account, and taps
  "Assumir este perfil". From then on they *are* that player; their real name replaces
  the stub name everywhere automatically.
- **Why it's clean:** because matches reference the membership (not the account),
  taking over is just attaching an account to the same membership — **zero history
  migration, no rating recompute**.
- **Trust:** the link alone is enough (the group vouches by sharing it). Reverting a
  claim (detaching the account so the member goes back to being a stub) exists as a
  backend capability but is not currently surfaced in the UI.
- **Already a member? (merge)** If the person taking over is *already* in the group,
  we **merge** the stub into the membership they already have: the stub's matches are
  re-pointed onto that membership, the stub is removed, and ratings/ranks/stats are
  rebuilt (async `GROUP_RANKING_REBUILD`) so the combined history is consistent.
  - **The one block:** merging is refused if the stub and that membership ever shared
    a match in the group (as partners *or* opponents). Re-pointing would put the same
    person twice in one match — impossible (`@@unique([matchId, groupMemberId])`).
    The claim returns a *blocked* outcome that the claim page renders in full (it shows
    the shared matches and admin contacts) and nothing changes. The full claim
    experience — link vs. request/approval, the claim page, both outcomes — lives in
    [profile-claim.md](./profile-claim.md).
  - **What's preserved / what isn't:** all match history, ratings and ranking are
    recomputed from the combined set. Match *highlight* feed cards created before the
    merge keep the name as it was recorded (e.g. the old stub name) — they aren't
    re-rendered; this is accepted as historical for a rare operation.

## Not in this release

- **Reconciling two memberships that already shared a match** (the blocked merge
  above): would require splitting/curating match history — deliberately out of scope.
- Heavier admin governance: promote in bulk, bespoke merges.
