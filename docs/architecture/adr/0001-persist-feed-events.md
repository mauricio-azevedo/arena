# ADR 0001: Persist feed events

## Status

Accepted

## Context

Arena needs a home feed that shows relevant product moments such as group creation, member joins, dominant wins, close matches, upsets, ranking changes, and milestones.

A feed could be built by querying all source tables on every request and reconstructing events dynamically, but that would become expensive and hard to keep consistent as event types grow.

Some events also need stable historical metadata. For example, an `Atropelo!` feed item should preserve winners, losers, score, group, and occurrence time as a product moment.

## Decision

Arena persists feed moments as `FeedItem` rows.

Domain workflows generate or synchronize feed items when source actions happen.

Examples:

- group creation creates `GROUP_CREATED`;
- membership activation creates `MEMBER_JOINED`;
- match create/update synchronizes `MATCH_BLOWOUT` when the score qualifies as `Atropelo!`.

## Consequences

### Positive

- Feed reads are faster and simpler.
- Event contracts are explicit.
- Visibility and importance can be stored per item.
- Historical event metadata is stable.
- Future feed ranking can use persisted `importanceScore` and `occurredAt`.
- New feed events can be added through event-specific generators.

### Negative

- Write flows become responsible for feed consistency.
- Edits/deletes must update or remove related feed items.
- Product rule changes may require backfills if old events need to change.

## Implementation notes

Feed event generation should use:

- typed input objects;
- event-specific generators;
- `FeedOrchestratorService` methods;
- transactions when events must stay consistent with domain writes.

## Alternatives considered

### Reconstruct feed at read time

Rejected for now because it would make feed reads more complex and increasingly expensive as event types grow.

### Store only raw activity logs

Rejected because the feed is a product surface, not a raw audit log. It should show curated moments with product-specific metadata and relevance.
