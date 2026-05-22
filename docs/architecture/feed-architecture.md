# Feed Architecture

The BeachRank feed is a persisted event system for product moments.

It is intentionally not built as a raw query over every source table at read time. Instead, important moments are generated when domain actions happen and stored as `FeedItem` rows.

## Why feed items are persisted

Persisted feed items give BeachRank:

- fast feed reads;
- stable historical event text/metadata;
- explicit visibility rules;
- easier ranking and relevance scoring;
- consistent behavior when source entities are updated;
- a clear extension point for future feed moments.

## Data model

The central model is `FeedItem`.

Important fields:

```txt
id
type
scope
visibility
groupId
actorUserId
actorGroupMemberId
subjectUserId
matchId
importanceScore
metadata
occurredAt
createdAt
```

### `type`

Technical event type.

Examples:

```txt
GROUP_CREATED
MEMBER_JOINED
MATCH_BLOWOUT
```

### `scope`

The product area the event belongs to.

Current values:

```txt
GROUP
USER
```

Most current events are group-scoped.

### `visibility`

Who can see the event.

Current values:

```txt
GROUP_MEMBERS
SOCIAL_CIRCLE
PUBLIC
PRIVATE
```

### `metadata`

Event-specific JSON payload.

Each event type should document its metadata contract in [`../product/feed-events.md`](../product/feed-events.md).

### `importanceScore`

Stored base relevance score.

The feed reader can combine this with recency or future personalization to calculate `feedScore`.

### `occurredAt`

The product time of the event.

For match-derived events, this should normally be the match `playedAt`, not the moment the feed item was created.

## Backend components

```txt
api/src/feed/
  feed.module.ts
  feed.controller.ts
  feed-reader.service.ts
  feed-writer.service.ts
  feed-score.service.ts
  feed-orchestrator.service.ts
  generators/
  types/
```

### `FeedController`

HTTP entrypoint for feed reads.

Current route:

```txt
GET /feed
```

Requires authentication.

### `FeedReaderService`

Responsible for returning the signed-in user's feed.

Current responsibilities:

- find the viewer's active group memberships;
- derive social/group context;
- query feed items visible to the viewer;
- include group and user display data;
- calculate `feedScore`;
- sort and limit the feed response.

### `FeedWriterService`

Low-level writer for feed items.

Use this when a generator produces a draft and the caller wants a simple create.

### `FeedOrchestratorService`

Domain-facing service used by other modules.

Responsibilities:

- call event-specific generators;
- create/upsert/delete feed items as needed;
- keep domain modules from knowing persistence details;
- provide event lifecycle methods such as `createMemberJoinedItem` or `syncMatchBlowoutItem`.

### Generators

Each feed event type should have its own generator.

Examples:

```txt
group-created-feed-item.generator.ts
member-joined-feed-item.generator.ts
match-blowout-feed-item.generator.ts
```

A generator should:

- receive a typed input;
- apply the event's product rule;
- return a `FeedItemDraft` or `null` when the event should not exist;
- not write directly to the database.

### Types

Feed input/draft contracts live in `api/src/feed/types/`.

Examples:

```txt
feed-item-draft.type.ts
feed-item-generator.type.ts
group-created-feed-input.type.ts
member-joined-feed-input.type.ts
match-blowout-feed-input.type.ts
```

## Frontend components

```txt
web/src/features/feed/
  home-feed.tsx
  feed.api.ts
  components/
  helpers/
  types/
  enums/
```

### `HomeFeed`

Feature root for the home feed.

Responsibilities:

- read access token;
- call feed API;
- render loading/signed-out/error/empty states;
- render `FeedItemCard` for each item.

### `FeedItemCard`

Renders feed items by type.

Current behavior:

- generic group/social events use the base card style;
- `MATCH_BLOWOUT` uses a dedicated `Atropelo!` card.

As the feed grows, split large event renderers into smaller components when `FeedItemCard` becomes hard to read.

## Event lifecycle patterns

### Create-only event

Use when the source action creates a historical event that should not be changed later.

Example:

```txt
GROUP_CREATED
```

### Historical event with stable metadata

Use when a feed item should remain as it was at creation time.

Example:

```txt
MEMBER_JOINED
```

### Synchronized event

Use when a source record can be edited and the event should reflect the latest source truth.

Example:

```txt
MATCH_BLOWOUT
```

Synchronized events should support:

- create when rule becomes true;
- update when rule remains true but metadata changes;
- delete when rule becomes false;
- cascade delete when source record is deleted.

## Match-derived event flow

```txt
MatchesService.create/update
→ validate match body
→ fetch group members
→ write Match / MatchPlayers
→ update or recalculate ratings
→ FeedOrchestratorService.syncMatchBlowoutItem(...)
→ generator returns draft or null
→ orchestrator upserts or deletes FeedItem
→ transaction commits
```

The feed sync should stay inside the same transaction as the match write when the event must be consistent with match state.

## Ordering and scoring

Current feed ordering uses:

- stored `importanceScore`;
- calculated `feedScore`;
- `occurredAt` tie-breaker.

General guidance:

- higher product relevance should receive higher `importanceScore`;
- highly repetitive events should receive lower scores;
- rare, competitive, or milestone events can receive higher scores;
- do not use importance score as a substitute for visibility or permissions.

## Visibility and privacy

Feed visibility is enforced by `FeedReaderService` queries.

Event generation should still assign the narrowest reasonable visibility.

For match-derived events, default to `GROUP_MEMBERS` unless there is an explicit product decision to make them public or social.

## Failure behavior

Because feed events are persisted as part of domain transactions, feed write failure should normally fail the whole transaction when the feed item is required for consistency.

For future non-critical events, the product may choose eventual consistency, but that should be an explicit architecture decision.

## Extension guidance

When adding a new event:

1. Start in product docs with rule, lifecycle, visibility, and examples.
2. Add backend input type and generator.
3. Register generator in `FeedModule`.
4. Add an orchestration method.
5. Call from the source domain service.
6. Add frontend metadata type and rendering.
7. Add QA cases.
8. Update docs.
