# ADR 0002: Snapshot match ratings

## Status

Accepted

## Context

Arena ratings change over time as matches are registered, edited, or deleted.

The product needs to show historical match details such as:

- player rating before the match;
- player rating after the match;
- player rating delta;
- team rating before/after;
- expected/actual result values.

If historical match screens relied only on current `GroupMember.rating`, old matches would become inaccurate after later matches changed ratings.

## Decision

Arena persists rating snapshots on `Match` and `MatchPlayer` records.

`GroupMember.rating` stores the current group-scoped rating.

`Match` stores team-level rating snapshots.

`MatchPlayer` stores player-level before/after/delta snapshots.

## Consequences

### Positive

- Historical matches remain explainable.
- Match cards can show rating deltas without recomputing history.
- Feed events can use stable match/rating metadata.
- Rating algorithm migrations can be reasoned about through `ratingAlgorithm` fields.

### Negative

- Match writes must keep snapshots correct.
- Edits/deletes/retroactive inserts require full rating recalculation.
- More data is stored per match.

## Implementation notes

Normal append-only match creation uses current `GroupMember.rating` values to calculate the new match only.

Operations that can affect history trigger recalculation:

- match edit;
- match delete;
- retroactive match create.

## Alternatives considered

### Calculate all historical rating data on read

Rejected because it would make match/profile/group reads slower and more complex.

### Store only current rating

Rejected because historical match details would not be accurate or explainable.
