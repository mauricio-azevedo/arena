# Rating Architecture

BeachRank ratings are group-scoped skill estimates updated from match results.

The rating system must support two competing needs:

1. fast match creation for the common case;
2. historically correct recalculation when old match data changes.

## Core concepts

### Group-scoped rating

A user's rating lives on `GroupMember`, not directly on `User`.

This means:

- the same user can have different ratings in different groups;
- ranking is always group-specific;
- match calculations use group member ratings.

### Initial rating

Current initial rating:

```txt
1000
```

### Rating algorithm

Current algorithm label:

```txt
BEACH_ELO_V1
```

The label is stored on rating-related records so future migrations or recalculations can identify which algorithm produced the snapshot.

## Persisted rating fields

### `GroupMember`

Stores the current rating for that member in that group.

Important fields:

```txt
rating
ratingAlgorithm
```

Additional fields exist for future rating systems:

```txt
ratingDeviation
ratingVolatility
ratingMu
ratingSigma
```

### `Match`

Stores match-level rating snapshots.

Important fields:

```txt
teamAExpected
teamBExpected
teamAActual
teamBActual
teamARatingBefore
teamBRatingBefore
teamARatingAfter
teamBRatingAfter
ratingAlgorithm
```

### `MatchPlayer`

Stores player-level rating snapshots.

Important fields:

```txt
ratingBefore
ratingAfter
ratingDelta
playedAt
```

## Why snapshots are persisted

Snapshots make historical records explainable.

Without snapshots, old match screens would have to reconstruct historical rating state from current data, which would be slow and fragile.

Snapshots also let product surfaces show:

- rating delta per player;
- team expected/actual result;
- rating before/after at the time of the match;
- feed moments based on match significance.

## Match creation fast path

The common product flow is append-only:

```txt
A match just happened → user registers it now
```

For this case, the new match can be calculated from current `GroupMember.rating` values.

Flow:

```txt
create match
→ fetch four active group members
→ calculate rating result for only this match
→ create Match with team snapshots
→ create four MatchPlayers with player snapshots
→ update rating for four affected GroupMembers
→ sync match-derived feed events
```

This avoids recalculating the entire group history on every normal match creation.

## When full recalculation is required

Full recalculation is required when historical rating order may change.

Current cases:

- editing a match;
- deleting a match;
- creating a match with `playedAt` before the latest match in the group.

These operations can affect later ratings, so the system recomputes ratings from the beginning of the group timeline.

## Full recalculation flow

```txt
load all group members
→ initialize every member rating to 1000
→ load all group matches ordered by playedAt asc, createdAt asc
→ for each match:
    calculate result from current in-memory ratings
    update MatchPlayer snapshots
    update Match snapshots
    update in-memory member ratings
→ update GroupMember current ratings
```

## Timeline ordering

Matches are ordered by:

```txt
playedAt asc
createdAt asc
```

This ordering should remain stable because rating history depends on it.

Read screens may choose different ordering for UI, usually newest first.

## Retroactive matches

A match is retroactive when its `playedAt` is older than the latest existing match in the group.

Retroactive creation must use full recalculation because it can change the rating snapshots of every later match.

## Feed interaction

Match-derived feed events should be synchronized after match/rating writes within the same transaction.

Examples:

- `MATCH_BLOWOUT` / `Atropelo!`
- `MATCH_CLOSE` / `No detalhe!`

Why after rating writes?

- future events may depend on rating deltas or ranking movement;
- feed should reflect committed match truth;
- feed events should be consistent with match edits.

## Performance considerations

### Fast path complexity

Normal match creation updates only:

- one `Match`;
- four `MatchPlayer` records;
- four `GroupMember` ratings;
- relevant feed items.

This should remain fast even as group history grows.

### Full recalculation complexity

Full recalculation grows with:

- number of group matches;
- number of match players;
- number of group members.

Because this is more expensive, it should be reserved for operations that require historical correctness.

## Correctness rules

1. Never update `GroupMember.rating` without also preserving match/player snapshots when a match is involved.
2. Do not use the append-only fast path for retroactive matches.
3. Editing/deleting a match must recalculate history.
4. Rating snapshots should use the same algorithm label as current ratings.
5. Feed events that depend on match results should be synced in the same transaction.

## Future improvements

Potential future work:

- unit tests for rating calculations;
- integration tests for append-only vs recalculation paths;
- background jobs for very large historical recalculations;
- audit table for rating recalculation runs;
- richer rating algorithms using deviation/volatility fields;
- ranking movement feed events based on before/after ranking snapshots.
