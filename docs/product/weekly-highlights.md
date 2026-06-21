# Weekly Highlights — "Essa semana"

> **Phase:** Product definition (concept). This document owns the *why*, the *experience*,
> and the *rules*. It does **not** describe implementation — the engineering plan lives
> separately and is disposable; this document is meant to outlive it.

A recognition section on the home screen that surfaces players who did something worth
noticing this week — a win streak, a climb, a milestone — and always keeps a small window
open onto the wider Arena.

## Problem

The home already has a "featured players" section, but it ranks the top players by a
win-rate score. That is a leaderboard in disguise: it answers *"who is best"*, which the
ranking screen already answers, so it adds nothing. It is global and impersonal, and it
never tells a story.

The home should answer a different question — **"what happened this week, and who should
I pay attention to?"** — and it should feel like it's about *people you know*.

## Who it's for

Everyone who opens the app, including logged-out and groupless visitors. The section
adapts to the viewer:

- **Members with active groups** mostly see people they know — recognition.
- **Quiet weeks, few groups, logged-out** lean on the wider Arena — aspiration / discovery.

## The experience

One horizontal rail titled **"Essa semana"**. Each card leads with a one-line reason a
person earned the spot — never a rank or rating. The viewer's own people come first;
the section *always* appends a few standouts from across the whole Arena.

| Viewer | What they see |
|---|---|
| Active member, lively week | Their people's moments, then a few from the Arena |
| Member, quiet week | A couple of their people, more from the Arena |
| Logged-out / no group | Only the Arena's standouts |

The progression is the point: on day one the section shows the whole Arena; as you join
groups and play, it quietly fills with familiar faces. The product becomes more personal
the more you invest in it — without ever announcing that it did.

## Principles

- **Every card has a sentence.** If we can't write the reason in one line, the player
  doesn't belong. The sentence — not the rank — is the hero.
- **Recognition needs relationship.** Your people are always shown first; a stranger's
  achievement never outranks someone you know.
- **Measured within the group.** Every moment — streak, climb, lead, milestone — is scoped to
  the group it happened in; that's where it has meaning. (A cross-group view of a player's
  total dedication is a future addition, not this version.)
- **Silence over explanation.** The title never names the scope. Familiar faces speak for
  themselves; the title just disappears and lets the content show.
- **Honest emptiness.** A slow week shows fewer cards. The section hides entirely rather
  than padding itself with players who have no reason to be there.
- **A permanent window on the Arena.** Even an engaged member always sees a few moments
  from the wider Arena — discovery and aspiration never switch off.

## Rules

**Window.** A moment qualifies if it happened within the last **7 days**.

**Achievements (the reasons a player appears).** All are group-scoped.

| Achievement | Earned by | Sentence |
|---|---|---|
| Win streak (current) | The player's **current** unbroken run of **3+** wins, still alive this week | "Está a {N} partidas sem perder" |
| Win streak (record) | Holding the group's **longest win streak this week** — one holder, replaced when someone matches or beats it | "Venceu {N} seguidas" |
| Climb | The biggest unbroken run of upward ranking moves whose last step is within the week (see below) | "Subiu {N} posições" |
| Leadership | Becoming the **sole #1** of the group (strictly top, alone), this week. Repeatable; a tie at the top doesn't fire | "Assumiu a liderança" |
| Milestone (matches) | Crossing **10 / 25 / 50 / 100** matches in the group this week | "Chegou às {N} partidas" |
| Milestone (wins) | Crossing **10 / 25 / 50 / 100** wins in the group this week | "Chegou a {N} vitórias" |

### How the climb is counted

The climb celebrates an *ascent*, not where someone sits right now. It's the **biggest
unbroken run of upward position moves** a player made — each step counting whether it came
from their own win or from someone above them falling.

- **High-water mark.** If the player later slips, the climb still happened — it keeps
  showing while it's recent. We celebrate the rise, not the current standing.
- **All-or-nothing, anchored to its end.** A run shows at its full size and stays visible
  for 7 days after its last step, then disappears cleanly. We never show a shrinking or
  half-counted number.
- **Never negative.** Only ascents earn a card; a decline just means no climb card this week.
- **Deliberately different from the ranking screen.** The ranking shows a per-match move
  ("+2 nesse jogo"); the highlight shows the week's run ("+6 essa semana"). Two honest
  lenses on different intervals, each clearly labelled — not a contradiction. The ranking's
  own movement display is left unchanged.

A brand-new member needs no special case: their run simply counts from their first matches.

### Current streak vs. record streak — two cards

**Win streak (current)** is each player's *ongoing, still-alive* run — anyone on a live run
(3+) can have one, and it disappears the moment their streak breaks.

**Win streak (record)** is the **group's longest win streak of the week** — a single weekly
record, held by whoever reached the highest streak (the most recent to reach it, on a tie).
It changes hands as the week goes on: someone hits 3 and holds it, another matches or beats
it and takes over, and so on. It's high-water for the week — the holder keeps it even if
their own run has since broken. The first card is about momentum *right now*; the second is
the week's *top streak in the group*. (This also dissolves any "everyone's first streak is a
record" triviality — there is only one record per group.)

### Taking the lead

Distinct from the climb (which celebrates the *ascent*), this celebrates reaching the
*summit*: becoming the **sole #1** of the group. It's **repeatable**, since the lead changes
hands over time — unlike an all-time-best position, which caps at #1 and would never fire
again (and would trigger trivially at a group's genesis).

- **Ties don't fire.** While two or more share the top there's no single leader to crown;
  whoever later pulls strictly ahead earns it.
- This also handles a brand-new group cleanly: everyone starts tied at 1000 (no sole leader),
  so no trivial "leader" card until someone genuinely breaks away.
- It's a moment: once taken this week, it stays celebrated even if the lead is lost again
  before the week ends.

**Selection.**

- **Your people first**, up to **5**, ordered by strength: **leadership leads** (becoming the
  group's sole #1 is the marquee moment), then streaks (by length), climb (by positions),
  milestones (by threshold) — a big magnitude can still jump tiers (a long streak or a 100th
  match is a headline on its own). Exact weights are an implementation detail.
- **Always +3 from the Arena**, held to a **higher bar** (a stranger must impress without the
  relationship): win streak 5+, record streak 5+, climb 5+, milestone 50+ (matches or wins);
  leadership always qualifies (being a group's sole #1 is strong on its own). From people
  outside your groups, never repeating someone already shown.
- One card per person (their strongest moment); at most two of the same achievement type
  in each part.
- The viewer **can** appear among their own highlights.
- **No people of your own** (logged-out or no group) → the rail is Arena-only and fills up to
  the full **8**, so the section length is the same in every state.
- The section hides only when there's nothing in either part.

**Card anatomy.** Avatar + name, the sentence as the hero, and the group it happened in.
Arena cards (outside the viewer's groups) carry a quiet "no Arena" cue so three otherwise
unexplained strangers read as intentional. Tapping a card opens that player in that group.

**Freshness.** Highlights reflect matches that have finished processing. A just-registered
match appears once processing completes (seconds). Eventual consistency is expected and
acceptable.

## Non-goals

- Not a leaderboard. It must never reduce to "top players by rating".
- Not a complete activity log — only earned, noteworthy moments.
- Not restricted to elites — a dedicated player's milestone shares the stage with a
  top player's streak, on purpose.
- The title never advertises its own scope ("seus grupos", "no Arena", etc.).

## Open questions

The core rules are settled. What remains is pure tuning:

- Exact numeric weights/thresholds (the qualitative ordering — **leadership first** — is decided).
- Visual polish of the "no Arena" cue on backfill cards.

## How we'll know it worked

- The section stops mirroring the ranking screen — featured players are people *moving*,
  not just people *winning*.
- Members recognize names in it and tap through.
- New / groupless users get a credible, alive first impression of the Arena.

## Out of scope (fast-follow)

"Beat the #1", new personal-best rating, comeback after inactivity, unbeaten doubles
partnership, cross-group total milestone (for the logged-out state), and explicit cooldown to
rotate the spotlight. Each is just a new reason a card can appear, on the same foundation.

---

# Appendix — Design log: decisions, alternatives & paths not taken

> The spec above is the conclusion. This log records how we got there: every question weighed,
> every option, what we chose, and — deliberately — what we rejected or discarded and why.
> Quotes in Portuguese are the original framing/card copy.

## Process & framing
- Adopted a quality bar: *"if Apple owned this, how would THEY ship it?"* — lead with the
  product and the experience, prefer silence over explanation, cut what doesn't earn its place.
- Phased approach: this concept doc (why / what / rules) is **durable** and kept **separate**
  from the disposable engineering plan. Decisions were locked before any code.

## Why the section exists
- Starting point: the existing `PlatformTrendingPlayer` rail ("Jogadores em alta") ranked the
  top 3 by a win-rate composite score (`recentWins×4 + winRate×25 + …`).
- Judged a **"leaderboard in disguise"** — redundant with the ranking, global, impersonal,
  story-less. Decision: rebuild around **story / recognition** (every card needs a one-line
  reason). **Rejected:** keeping any "top players by score" model.

## Surface, scope & title
- Started "platform home, job = **recognition**" (over discovery/engagement), then made it
  **universal** — everyone, including logged-out — rejecting a members-vs-strangers split.
- Title: chose **"Essa semana"** (silence over explanation) over *"…no Arena"* (overpromises)
  and *"…nos seus grupos"* (names the plumbing). *"…no Arena"* parked for a logged-out marketing
  surface.

## The Arena window (backfill)
- Evolved from "backfill only when thin" (vs "always fill to 5" / "never mix") to the user's
  **"sempre +3 do Arena"** — a permanent window, not a fallback.
- **One row** (*"uma fileira só"*) over two labelled zones, accepting that Arena cards must
  self-explain. Length model **A — always 3** (over a shrinking "tight reel" and a vanishing
  "fill only").

## Length, ordering & logged-out
- Your people up to **5** + always **3** Arena = up to **8**.
- Ordering: **leadership first** (chosen) / streak-first / pure magnitude.
- Logged-out count: 3 / ~6 / **8** (chosen — keeps max length consistent across states).
- Arena higher bar for strangers: streak 5+, record 5+, climb 5+, milestone 50+, leadership
  always qualifies. (Earlier draft: streak 5+/climb 3+/milestone 25+ — updated for 6 types.)
- Visual cue: **name + subtle "no Arena" chip** (chosen) / distinct card treatment / name only.

## The climb — the long road (the hardest thread; many models tried and discarded)
- "Net rise of N positions" broke on **passive movement** (rising without playing) and on
  **contradicting the ranking** (card +8 vs board +6) — surfacing the principle *the card must
  never contradict the ranking.*
- A **live snapshot delta** (rank now − 7 days ago) fixed divergence, but a **21-day simulation**
  exposed it as *momentum vs your past self*: it **deflates at the peak** and goes **negative
  right after a win**.
- The user's **movement-streak** idea fixed "won-but-down" but still deflated at the peak and
  **flickered** when others played.
- Turning point: *"talvez o card não deva ser tão fiel ao ranking"* → **accept divergence**
  ("+6 essa semana" vs "+2 nesse jogo") as two labelled lenses.
- **Landed on:** biggest unbroken up-run, **high-water, atomic, anchored on its end**. Discarded
  along the way: earned-only delta, destination-as-the-climb, frozen weekly digest, reworking
  the ranking's badge.

## Win streak (current & record)
- Floor **3** (user overrode 4); **no anti-farm**. Split into **current** and **record**.
- Record was first "personal-best streak," which made everyone's first 3 trivially a record
  (discarded fixes: floor 4, magnitude weighting). User **redefined** it as the **group's
  longest streak of the week** (one holder, replaced), dissolving the problem.
- Copy: *"Está a {N} partidas sem perder"* (current) / *"Venceu {N} seguidas"* (record).

## Leadership (was "best rank")
- User added a "best rank reached" achievement; clarified it must be the **all-time best in the
  group**, broken this week (not the week's best).
- User then found the **fatal flaw**: all-time-best is monotonic and capped at #1 — it fires
  once (trivially at genesis, where all are tied at 1000) and never again.
- **Redesigned to Leadership:** becoming the **sole #1**, repeatable. Ties: **sole leader only**
  (ties don't fire; excludes the genesis all-tied state for free). Sentence: **"Assumiu a
  liderança."** **Rejected:** "leadership + top 3" (fuzzy in small groups); dropping the
  destination entirely.

## Milestones
- Matches milestone (10/25/50/100, *"Chegou às {N} partidas"*).
- "Matches vs wins" basis → **both**: user added a **wins** milestone (10/25/50/100,
  *"Chegou a {N} vitórias"*).

## Other transversal decisions
- **Passive movement:** a 100%-passive climb/leadership (no win, maybe didn't even play) →
  **allowed to fire** (user chose this over the recommended "require ≥1 win").
- **Small groups:** climb gate by group size / scale with size / **no gate** → **no gate**
  (climb works in every group size).
- **Selection mechanics:** one card per person (strongest); ≤2 of a type per part; viewer can
  appear among their own; section hides only when fully empty.
- **Window:** 7 days. **Freshness:** eventual consistency (reflects processed matches).

## Discarded & deferred (consolidated)
- **Discarded climb models:** rolling net delta, earned-only delta, destination-as-the-climb,
  movement-streak, frozen weekly digest, touching the ranking's own movement badge.
- **Discarded gates:** streak anti-farm, climb min-group-size, record-streak floor.
- **Fast-follow (out of MVP):** "beat the #1", new personal-best **rating**, comeback after
  inactivity, unbeaten doubles partnership, cross-group **total** milestone (logged-out),
  explicit cooldown, a separate "weekly recap/digest" surface, a personal "best streak" record.
