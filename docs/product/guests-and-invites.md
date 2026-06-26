# Guests &amp; Invites — convidados e o link único do grupo

> **Phase:** Proposed redesign — not yet implemented. This document owns the target
> model (the _why_, the _experience_, the _rules_). The currently shipped behavior is
> the **email-anchored claim**, described in
> [`../architecture/data-model.md`](../architecture/data-model.md) and
> [`../engineering/database-reference.md`](../engineering/database-reference.md), and is
> **superseded** by this document. The engineering plan (schema, services, UI) is
> separate and disposable; this document is meant to outlive it.
>
> Replaces the former `stub-players.md` + `profile-claim.md`. The decision and its
> trade-offs are recorded in
> [ADR 0004](../architecture/adr/0004-unify-guest-invite-and-claim.md).

A **guest** (convidado) is a player who is part of a group but doesn't have an account
yet. Someone typed their name on the court so they could be scored today; later, the real
person can **take over** that guest and keep all of its history — matches, rating, ranking
position. Joining a group and taking over a guest are the **same act** through **one group
link**: the person opens it and says which player they are.

## Problem

Two problems, one root.

1. **People play on a beach court, not at a keyboard.** Anyone added to a match usually
   doesn't have their phone in hand. A flow that requires them to receive a link, install
   the app, and sign up _before_ they can appear in a match has already failed the moment
   that matters — registering today's game.
2. **The old model had two front doors that produced the same person twice.** A generic
   invite link created a brand-new member; a name typed on court created another; an
   email-anchored claim then tried to reconcile them. Duplicates were designed in, and the
   painful, partly-blocked **merge** existed only to clean up after them.

The fix to (1) is the guest: add a player with just a name, no account required. The fix to
(2) is to let the **person identify themselves** when they arrive: they know who they are
better than anyone, so they pick their existing player instead of creating a second one.

## The reframe — one group link, the person self-identifies

There is one entity: the **player** (`GroupMember`). It exists the instant someone types a
name. Having an account is just a state of that player: **unclaimed** (a guest, dashed
avatar) or **claimed** (a real member).

There is one entry surface: **a single group link / QR.** Whoever opens it authenticates
(or signs up) and is asked **"which of these players are you?"** — the list of the group's
**unclaimed guests**:

- **Finds themselves and picks** → they **take over** that guest and inherit its history.
  Joining _is_ the claim.
- **Not in the list** → they **join directly** as a new member.

Because the person points at the player that already represents them, the targeted path
doesn't create a second one — the duplicate is avoided at its source, by the one who knows
best.

## Who can do what

- **Create a guest on court:** any active member. Low-risk, high-frequency — the arena path.
- **Take over a guest / join:** the person themselves, via the group link. No admin in the
  loop for the happy path.
- **Govern guests (delete a mistaken one, revert a take-over):** admins.

## The experience

### 1. Creating a guest on court (unchanged)

The fastest add is the one that happens where you already are — the **player picker inside
match registration**:

- In a player slot, search for a teammate by name.
- If no one matches, the same field offers **Criar "&lt;name&gt;"**.
- One tap creates the player, drops them into the slot and the group.

A brand-new group with fewer than four members is never blocked from opening the match form
— you build the roster while registering the first match. A guest is **visibly marked as
not-yet-claimed** — a "Convidado" tag and/or the members list grouped by role
(admins · members · guests) — so it's legible who can still be taken over; the dashed avatar
already hints at it, and the exact treatment is settled at design time. A guest's name is
also **not a profile link** — there's no account behind it yet.

### 2. Opening the group link — "which of these is you?"

The group has **one shareable link / QR** (paste it in the group's chat, show the QR on the
court). On open, after auth/signup, the person sees the group and the list of **unclaimed
guests**:

- Each entry shows enough to self-recognize (name, and on selection its history) so the
  right "João" is picked, not a namesake.
- Picking one leads to the **recognition screen** before committing (below).
- A clear **"não estou aqui — entrar como novo"** option joins directly.
- **Empty list** (new group, or all players already claimed) → the step is skipped and the
  person joins directly.
- **Already a member** who opens the link still sees the list — they can take over a guest
  (a **merge**, below) — or just continue into the group.

### 3. Taking over a guest ("assumir o perfil")

After picking a player, a recognition screen answers "is this me?" before asking to commit:

- **Recognition first.** The player's name, where it sits (posição · rating · partidas), and
  its **last few matches** (partners and opponents) — so the person confirms it's really
  their history before taking it.
- **Confirm → two outcomes:**
  - **Assumido (success).** The history is theirs; their real name replaces the guest name
    everywhere automatically. If they weren't a member, they join as that player; if they
    already were, the guest **merges** into their membership.
  - **Conflito (blocked) — the one block.** If the person and the player ever shared a match
    in the group (partners _or_ opponents), they're provably different people; merging would
    put the same person twice in one match. The take-over is refused and nothing changes.
- **Taking over is instant** — no admin approval. The **admin is notified** ("Fulano assumiu
  o convidado Beltrano") and can **revert** it if it was wrong.

### Why taking over is cheap

Matches reference the **membership**, not the account. So taking over a guest that isn't yet
a member is just **attaching an account to the same membership** — zero history migration,
no rating recompute. The merge case (already a member) re-points the guest's matches onto the
existing membership and rebuilds ratings/ranks/stats asynchronously, so the combined history
is consistent. Because that rebuild is async, the success screen after a merge surfaces a
brief **"recalculando"** state rather than showing pre-merge numbers as final.

## Rules

- A guest has a **required name** and no linked account; the name lives on the member itself.
  A real member's name always comes from their account.
- A guest **participates fully** in matches, ratings, and the group ranking, exactly like a
  real member. It has no personal home feed, so it never earns personal/weekly highlights.
  Its name is **not a profile link** anywhere.
- A guest has only **two states**: unclaimed (dashed avatar) and claimed. There is **no
  pending/declined/invited state** — nobody anchors a guest to anyone; a person either takes
  it over or doesn't. The unclaimed state is **surfaced** (a "Convidado" tag and/or grouping
  in the members list), so admins and members can see who's still a guest.
- **Self-identification is the consent**, the **shared-match block** is the hard guard, and
  the **admin notification + revert** is the safety net. There is no approval gate on the
  happy path.
- A take-over is **reversible by an admin** (detach the account; the member goes back to a
  guest).
- The **shared-match block is absolute** — never overridden, by anyone. Fixing a wrong block
  means fixing the mis-logged match, not forcing the take-over.

## Assumptions (premissas)

| #   | Assumption                                                                                               | Source           |
| --- | -------------------------------------------------------------------------------------------------------- | ---------------- |
| P1  | Matches reference `GroupMember`, never `User` — the invariant that makes take-over cheap. Not revisited. | crown-jewel      |
| P2  | `stub` is renamed `guest` (convidado) across product **and** code.                                       | product decision |
| P3  | Invite + claim are one act through a **single group link**; the person self-identifies.                  | product decision |
| P4  | The person picks their existing guest from the unclaimed list (browse), or joins as new.                 | product decision |
| P5  | No admin targeting (no user search, no per-guest link), no email anchor, no pending/declined state.      | product decision |
| P6  | Not in the list → join directly, no approval. A rare race-duplicate is accepted and resolved by merge.   | product decision |
| P7  | Take-over is instant + reversible by an admin; the admin is notified of every take-over.                 | product decision |
| P8  | The shared-match merge block is physics of the data (`@@unique([matchId, groupMemberId])`) and survives. | invariant        |

## Cases &amp; edges

| Case                                                                 | Behavior                                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Name typed on court, never claimed                                   | Stays a guest forever; scores normally; dashed avatar.                                                                                     |
| Opens link, finds self in the list                                   | Recognition → takes over instantly; admin notified; reversible.                                                                            |
| Opens link, not in the list                                          | Joins directly as a new member, no approval.                                                                                               |
| Unclaimed list is empty                                              | Step is skipped; joins directly.                                                                                                           |
| Already a member, opens the link                                     | Can take over a guest (merge), or continue into the group.                                                                                 |
| Person taking over is **already a member**                           | Guest merges into their existing membership; ratings/ranks rebuilt async.                                                                  |
| Person and player **shared a match**                                 | Take-over refused (the one block); nothing changes; reuses the conflict screen.                                                            |
| Race-duplicate (joins as new before being typed as a guest on court) | Accepted; resolved by merge later.                                                                                                         |
| Link forwarded to the wrong person                                   | The recognition screen is the guard; if they take over wrongly, an admin reverts.                                                          |
| Impostor takes over a high-ranked guest (no shared match)            | Accepted; admin notification is actionable (one-tap revert); if the real owner already joined as a duplicate, recovered by revert + merge. |
| Admin created a guest by mistake                                     | Admin deletes the guest.                                                                                                                   |

## What changes from today

- **Removed:** `claimEmail` / `claimEmailStatus` / `claimEmailNotifiedAt`, the whole
  email-anchored claim flow and its registration hook, the admin claim-email panel, and the
  `CLAIM_OFFER` / `CLAIM_OFFER_DECLINED` notifications. There is no admin user-search and no
  per-guest invite link.
- **Added:** the single group link's **"which of these is you?"** self-identification step;
  an admin notification when a guest is taken over; admin **revert** and **delete-guest**
  controls.
- **Unified:** the generic join and the take-over collapse into one group-link entry.
- **Renamed:** stub → guest everywhere (UI copy, code, docs).
- **Reversed, on purpose:** the previous concept routed claims through an admin's email
  vouch. This model routes them through the person's own self-identification, with the
  shared-match block plus admin notify/revert as the safety net. It also makes a take-over
  reversible, where the prior concept treated it as irreversible.

## Accepted limitations

- **The single link is unrevocable for now.** If it leaks, anyone with it can join; link
  rotation is future work.
- **The unclaimed list is visible to any authenticated link-holder**, and a take-over is
  self-served. Impersonation is bounded by the shared-match block, the admin notification
  (actionable — revert in one tap), and admin revert — accepted for small, trusted groups.
  Worst case: an impostor takes over a high-ranked guest they never played against; the real
  owner then no longer finds themselves in the list and joins as a duplicate. It is
  **recoverable** — an admin reverts the take-over (restoring the guest) and merges the
  duplicate — not prevented. Identity verification is deliberately out of scope.
- **The recognition screen reveals a guest's recent matches and partners** to any
  link-holder who selects it — more than just names. Accepted for casual groups as part of
  the self-identify trade-off.

## Not in this concept

- **Identity verification** and **link rotation/revocation** — future work.
- **Reconciling two real memberships that already shared a match** — the blocked merge above.
  Would require splitting/curating match history; deliberately out of scope.
- **Heavier admin governance:** bulk operations, an audit log of take-overs.
- **Email / push delivery** of notifications — in-app only.
