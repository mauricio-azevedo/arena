# Feed Events

Feed events are persisted product moments shown in the BeachRank home feed.

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
| `MATCH_CLOSE` | TBD | match create/update | TBD | planned |
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

### UI behavior

Shows that a user created a group.

### Generation rule

Generated when a group is created.

### Visibility

`SOCIAL_CIRCLE`.

### Metadata

```ts
type GroupCreatedFeedMetadata = {
  groupName: string;
};
```

### Lifecycle

- Create group: create feed item.
- Update group: currently does not update existing feed text.
- Delete group: feed items are removed through group cascade.

## Event: `MEMBER_JOINED`

### UI behavior

Shows that a user joined a group.

### Generation rule

Generated when a user becomes an active group member through the join/invite flow.

### Visibility

`GROUP_MEMBERS`.

### Metadata

```ts
type MemberJoinedFeedMetadata = {
  displayName: string;
};
```

### Lifecycle

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

### Examples

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

Backend input type:

```ts
type MatchBlowoutFeedInput = {
  groupId: string;
  matchId: string;
  winnerTeam: MatchTeam;
  gamesA: number;
  gamesB: number;
  winners: MatchBlowoutFeedPlayer[];
  losers: MatchBlowoutFeedPlayer[];
  occurredAt: Date;
};
```

Frontend metadata type:

```ts
type DominantWinFeedMetadata = {
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: Array<{
    groupMemberId: string;
    userId: string;
    displayName: string;
  }>;
  losers: Array<{
    groupMemberId: string;
    userId: string;
    displayName: string;
  }>;
};
```

### Lifecycle

When a match is created:

- if it matches the Atropelo rule, create a `MATCH_BLOWOUT` feed item;
- otherwise do not create one.

When a match is updated:

- if it becomes an Atropelo, create the item;
- if it remains an Atropelo, update the item;
- if it stops being an Atropelo, delete the item.

When a match is deleted:

- the feed item is removed through match cascade.

### Consistency rule

`MATCH_BLOWOUT` is synchronized inside the same transaction as the match write.

This keeps match data, rating updates, and feed event generation consistent.

## Planned event: `MATCH_CLOSE`

Potential UI names:

- `No detalhe!`
- `Jogo decidido no detalhe`

Candidate generation rule:

- `7-6` always generates;
- `7-5` may generate with lower importance in the future.

Open decisions:

- final UI title;
- importance score;
- whether `7-5` qualifies;
- whether match duration or rating delta should affect relevance.

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
