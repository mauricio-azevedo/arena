# Weekly Highlights ("Essa semana")

`GroupHighlight` is the derived read model behind the home **"Essa semana"** rail — a
story-driven recognition section. It replaced the retired `PlatformTrendingPlayer`
win-rate leaderboard. Product rules:
[`../product/weekly-highlights.md`](../product/weekly-highlights.md); this doc is the
runtime architecture.

## Source of truth

Highlights are derived; the sources are `Match`, `MatchPlayer`, `GroupMember`. Never
hand-edit `GroupHighlight`.

## Projection (in the GROUP cascade)

`WeeklyHighlightsProjectionService.syncGroupHighlights(tx, groupId)` runs inside the
existing per-group cascade, after the rating, ranking-movement and stats projections (so
`MatchPlayer.ratingAfter` is already current). It is a full delete-and-rebuild per group,
idempotent like the other projections.

It reconstructs each member's **passive-inclusive** rank timeline by replaying matches
(reusing the persisted `ratingAfter` — no rating re-computation), then derives the six
achievement candidates and stores one row per `(member, type)`:

- `WIN_STREAK_CURRENT` — ongoing unbeaten run (≥3).
- `WIN_STREAK_RECORD` — the group's longest recent win run (a single holder).
- `CLIMB` — biggest unbroken up-run (high-water, anchored on its last step; passive moves count).
- `LEADERSHIP` — becoming the **sole** #1 (ties don't fire).
- `MILESTONE_MATCHES` / `MILESTONE_WINS` — crossing 10/25/50/100.

Each row carries `value`, a precomputed `score` (cross-type ordering — leadership leads,
big magnitudes can jump), and `anchorAt` (the moment the 7-day read window filters on).

## Read (`GET /home/weekly-highlights`)

`WeeklyHighlightsReadService.getWeeklyHighlights(viewerUserId?)` selects at read time (it
depends on the viewer and on "now", so it can't be precomputed):

- **Your people** — `GroupHighlight` from the viewer's active groups within the 7-day
  window; one card per person (their strongest), ≤2 per type, up to 5.
- **Arena backfill** — a viewer-independent, briefly cached pool of the strongest recent
  highlights from *other* groups, held to a higher bar (streak/record/climb ≥5, milestone
  ≥50, leadership always). Always appended; fills up to 8 when the viewer has no people of
  their own (logged-out / no group).

`OptionalJwtAuthGuard` makes the endpoint work logged-in and logged-out. The backend stays
copy-free; the Portuguese card sentences are composed on the frontend.

## Retirement note

`PlatformTrendingPlayer` (table, module, controller, projection, the `PLATFORM`-scoped job,
and `PlatformTrendingRebuildSchedulerService`) was removed. The now-unused
`ProcessingJobType.PLATFORM_TRENDING_PLAYERS_REBUILD` and `ProcessingJobScope.PLATFORM` enum
values are **kept (deprecated)** to avoid a fragile enum-value removal — see
`migrations/20260621043745_retire_platform_trending`.
