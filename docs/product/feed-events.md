# Feed Events

Feed events are persisted product moments shown in the Arena home feed.

The feed should not be treated as a raw activity log. Its purpose is to surface moments that are relevant, social, competitive, or meaningful to the user.

## Goals

Feed events should:

- make the app feel alive;
- highlight meaningful group activity;
- create lightweight competitive narratives;
- be fast to read and fast to load;
- be consistent across backend generation and frontend rendering.

## Non-goals

Feed events should not:

- show every low-value activity;
- duplicate full match history;
- expose data to users who should not see it;
- rely on expensive runtime reconstruction when a persisted event is better.

## Current event catalog

| Technical type | UI name | Source | Visibility | Status |
|---|---|---|---|---|
| `GROUP_CREATED` | Group created | group creation | `SOCIAL_CIRCLE` | implemented |
| `MEMBER_JOINED` | Member joined | invite acceptance / membership activation | `GROUP_MEMBERS` | implemented |
| `MATCH_BLOWOUT` | Atropelo! | match create/update | `GROUP_MEMBERS` | implemented |
| `MATCH_CLOSE` | No detalhe! | match create/update | `GROUP_MEMBERS` | implemented |
| `RANKING_MOVEMENT` | ranking movement headline | ranking projection after match processing | `GROUP_MEMBERS` | implemented |
| `UPSET_WIN` | TBD | match create/update | TBD | planned |

## Shared feed item fields

Every feed item should have these concepts:

- `type`: technical event type;
- `scope`: where the event belongs, currently usually `GROUP`;
- `visibility`: who can see it;
- `groupId`: group context when applicable;
- `matchId`: match context when applicable;
- `actorUserId`: primary user responsible for the event when applicable;
- `actorGroupMemberId`: group-scoped actor when applicable;
- `subjectUserId`: primary user affected by the event when applicable;
- `importanceScore`: base relevance score;
- `metadata`: event-specific JSON contract;
- `occurredAt`: when the product event happened;
- `createdAt`: when the feed item was persisted.

## Visibility rules

Use the narrowest visibility that satisfies the product need.

### `GROUP_MEMBERS`

Visible to active members of the related group.

Use for group-internal events such as match-derived moments.

### `SOCIAL_CIRCLE`

Visible to the actor and users connected through shared groups.

Use for broader social moments such as group creation.

### `PUBLIC`

Visible publicly.

Use only when the event is intentionally public.

### `PRIVATE`

Visible only to a specific user or private context.

Use for private future events if needed.

## Event: `GROUP_CREATED`

Generated when a group is created.

Visibility: `SOCIAL_CIRCLE`.

Metadata:

```ts
type GroupCreatedFeedMetadata = {
  groupName: string;
};
```

Lifecycle:

- Create group: create feed item.
- Update group: currently does not update existing feed text.
- Delete group: feed items are removed through group cascade.

## Event: `MEMBER_JOINED`

Generated when a user becomes an active group member through the join/invite flow.

Visibility: `GROUP_MEMBERS`.

Metadata:

```ts
type MemberJoinedFeedMetadata = {
  displayName: string;
};
```

Lifecycle:

- Join group: create feed item.
- Leave group: existing feed item remains historical unless a future privacy rule says otherwise.
- Group deletion: feed items are removed through group cascade.

## Event: `MATCH_BLOWOUT`

### UI name

`Atropelo!`

### Product meaning

A dominant win in a match.

### Generation rule

A match generates `MATCH_BLOWOUT` when:

- the winning team scored exactly `6` games; and
- the losing team scored `0` or `1` game.

Examples:

| Stored score | Winner | Generates? | UI score |
|---|---:|---:|---:|
| `6-0` | Team A | yes | `6-0` |
| `6-1` | Team A | yes | `6-1` |
| `0-6` | Team B | yes | `6-0` |
| `1-6` | Team B | yes | `6-1` |
| `6-2` | Team A | no | — |
| `7-1` | Team A | no | — |
| `7-6` | Team A | no | — |

The frontend must display the score from the winning team's perspective, not necessarily the stored Team A / Team B perspective.

### Visibility

`GROUP_MEMBERS`.

### Importance score

- `6-0`: `70`
- `6-1`: `60`

### Metadata

```ts
type DominantWinFeedMetadata = {
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: Array<{ groupMemberId: string; userId: string; displayName: string }>;
  losers: Array<{ groupMemberId: string; userId: string; displayName: string }>;
};
```

### Lifecycle

- Match created/updated and rule is true: create or update item.
- Match created/updated and rule is false: delete existing item.
- Match deleted: item is removed through match cascade.

## Event: `MATCH_CLOSE`

### UI name

`No detalhe!`

### Product meaning

A match decided by the smallest supported margin in a tie-break-like score.

### Generation rule

A match generates `MATCH_CLOSE` when:

- the winning team scored exactly `7` games; and
- the losing team scored exactly `6` games.

Examples:

| Stored score | Winner | Generates? | UI score |
|---|---:|---:|---:|
| `7-6` | Team A | yes | `7-6` |
| `6-7` | Team B | yes | `7-6` |
| `7-5` | Team A | no | — |
| `6-4` | Team A | no | — |
| `6-1` | Team A | no | — |

The frontend must display the score from the winning team's perspective, not necessarily the stored Team A / Team B perspective.

### Visibility

`GROUP_MEMBERS`.

### Importance score

- `7-6`: `55`

### Metadata

```ts
type CloseMatchFeedMetadata = {
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: Array<{ groupMemberId: string; userId: string; displayName: string }>;
  losers: Array<{ groupMemberId: string; userId: string; displayName: string }>;
};
```

### Lifecycle

- Match created/updated and rule is true: create or update item.
- Match created/updated and rule is false: delete existing item.
- Match deleted: item is removed through match cascade.

## Event: `RANKING_MOVEMENT`

### UI behavior

Shows a sports-style headline for meaningful ranking movement caused by a match, with a factual colored body and a compact score block.

The card should render:

```txt
Headline editorial

Em alta
↑ Ana  #13 → #5

Em queda
↓ Pedro  #1 → #4

Ana / João
6–2
Pedro / Lucas
```

The score block is visual. It should not narrate with words like “venceram”. The winning pair appears first.

### Generation rule

A match can generate at most one `RANKING_MOVEMENT` item.

A movement is relevant when:

- `positions >= 2`; or
- `direction = UP` and `currentRank = 1`; or
- `direction = DOWN` and `previousRank = 1`.

This means:

| Movement | Generates? | Reason |
|---|---:|---|
| `↑1` to `#1` | yes | new leader |
| `↑1` not to `#1` | no | too small |
| `↑2` / `↑3` | yes | visible movement |
| `↑4+` | yes | big movement |
| `↓1` from `#1` | yes | leader lost the top |
| `↓1` not from `#1` | no | too small |
| `↓2` / `↓3` | yes | visible movement |
| `↓4+` | yes | big movement |

### Copy rules

Movement verbs:

| Direction | Positions | Verb |
|---|---:|---|
| UP | `2-3` | sobe / sobem |
| UP | `4+` | dispara / disparam |
| DOWN | `2-3` | cai / caem |
| DOWN | `4+` | desaba / desabam |

Leadership has highest priority and should mention both old and new leader context when available:

```txt
Ana passa Pedro e assume a liderança
Ana assume a liderança que era de Pedro
Pedro cai da liderança e Ana assume o topo
```

Normal movement examples:

```txt
Ana passa Pedro e sobe no ranking
Ana dispara no ranking
Ana dispara e João sobe no ranking
Pedro desaba e Lucas cai no ranking
Ana e João disparam enquanto Pedro e Lucas desabam
```

Exception: when both sides have mixed intensity, avoid a four-verb headline.

Do not use:

```txt
Ana dispara e João sobe enquanto Pedro desaba e Lucas cai
```

Use:

```txt
O ranking virou do avesso depois da partida
```

### Visibility

`GROUP_MEMBERS`.

### Importance score

`80`.

### Metadata

```ts
type RankingMovementFeedMetadata = {
  headline: string;
  headlineVariant:
    | 'LEADERSHIP_CHANGED'
    | 'SINGLE_UP'
    | 'DOUBLE_UP'
    | 'SINGLE_DOWN'
    | 'DOUBLE_DOWN'
    | 'MIXED'
    | 'RANKING_TURNED_UPSIDE_DOWN';
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: Array<{ groupMemberId: string; userId: string; displayName: string }>;
  losers: Array<{ groupMemberId: string; userId: string; displayName: string }>;
  movements: Array<{
    groupMemberId: string;
    userId: string;
    displayName: string;
    direction: 'UP' | 'DOWN';
    positions: number;
    previousRank: number;
    currentRank: number;
    previousRating: number;
    currentRating: number;
    affectedMembers: Array<{
      groupMemberId: string;
      userId: string;
      displayName: string;
      rank: number | null;
    }>;
  }>;
  leadershipChange: {
    previousLeaders: Array<{ groupMemberId: string; userId: string; displayName: string }>;
    currentLeaders: Array<{ groupMemberId: string; userId: string; displayName: string }>;
    dethronedLeaders: Array<{ groupMemberId: string; userId: string; displayName: string }>;
  } | null;
};
```

### Lifecycle

`RANKING_MOVEMENT` is a synchronized projection of currently visible ranking movements, not only the last processed match.

After ranking projection completes for a group:

- create or update one `RANKING_MOVEMENT` feed item per match with relevant visible movements;
- delete group `RANKING_MOVEMENT` feed items for matches that no longer have relevant visible movements;
- delete through match/group cascade when source data is deleted.

This prevents stale feed cards when a later match invalidates an older ranking movement.

### QA cases

- `↑1` to `#1` creates leadership feed.
- `↑1` not to `#1` does not create feed.
- `↓1` from `#1` creates leadership feed.
- `↓1` not from `#1` does not create feed.
- `↑2` or `↓2` creates feed.
- `↑4+` uses `dispara`; `↓4+` uses `desaba`.
- One player moving up and passing up to two players can mention who was passed in the headline.
- One player moving up and passing three or more players keeps the headline short and lists affected names in the body.
- Later invalidation removes or updates stale ranking movement cards.
- Score block renders winners first.

## Planned event: `UPSET_WIN`

Potential UI names:

- `Zebra!`
- `Vitória improvável`

Candidate generation rule:

- winning team's average rating before the match is significantly lower than losing team's average rating before the match.

Open decisions:

- rating gap threshold;
- whether score matters;
- how to phrase the card without embarrassing players;
- importance score tiers.

## Future tasks

- Add group feed screen.
- Add feed/ranking update notification pill when backend processing changes visible data.
- Standardize match score rendering across the platform so winners are always shown first.

## Adding a new feed event

When adding a new feed event, update all relevant layers.

### Backend checklist

1. Add or confirm the `FeedItemType` enum value.
2. Define an explicit input type in `api/src/feed/types/`.
3. Create a generator in `api/src/feed/generators/`.
4. Register the generator in `FeedModule`.
5. Expose an orchestration method in `FeedOrchestratorService`.
6. Call the orchestrator from the domain write flow.
7. Use a transaction when the event must be consistent with other writes.
8. Decide whether the event should be create-only, upserted, synchronized, or deleted when source data changes.

### Frontend checklist

1. Add or confirm the frontend feed item type union.
2. Define metadata type in `web/src/features/feed/types/`.
3. Render the event in `FeedItemCard` or a child component.
4. Keep player/user names clickable when appropriate.
5. Keep layout mobile-first and scannable.
6. Add empty/error/loading considerations if the new event affects feed UX.

### Documentation checklist

1. Add the event to the catalog table.
2. Document UI name and product meaning.
3. Document generation rule and examples.
4. Document lifecycle.
5. Document visibility.
6. Document importance score.
7. Document metadata contract.
8. Add QA cases to critical flows when user-visible.
