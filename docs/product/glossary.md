# Product Glossary

This glossary defines the shared vocabulary used in BeachRank product, design, code, API contracts, and QA.

Use these terms consistently in documentation, PRs, UI copy, and implementation names.

## Core entities

### User

A registered account in BeachRank.

A user can belong to multiple groups and can appear in matches through group memberships.

### Group

A competitive community where members register matches, maintain rankings, and generate feed moments.

Examples:

- a regular beach tennis group;
- a club group;
- a tournament-like private community in the future.

Current product assumption: groups are public in the data model, but most operational behavior is group-member oriented.

### Group member

A user's membership inside a group.

A group member has group-specific data such as:

- display name;
- rating;
- role;
- active/left state.

Do not confuse `User` with `GroupMember`.

A user is global. A group member is group-scoped.

### Role

The permission level a group member has inside a group.

Current roles:

- `ADMIN`: can manage admin-only group actions, such as invite generation.
- `MEMBER`: can participate in the group and manage allowed member actions.

### Match

A registered beach tennis match between two teams.

A match has:

- group;
- four players;
- two teams;
- score;
- winner team;
- played date;
- rating snapshots.

### Team

One side of a match.

Current values:

- `TEAM_A`
- `TEAM_B`

A team has two group members.

### Match player

A player's participation snapshot in a match.

A match player stores historical information such as:

- group member reference;
- display name snapshot;
- team;
- position;
- rating before;
- rating after;
- rating delta;
- played date.

This exists so historical match records remain stable even if the group member changes later.

## Rating and ranking

### Rating

A numeric skill estimate for a group member within a group.

Current initial rating: `1000`.

Ratings are group-scoped. The same user can have different ratings in different groups.

### Ranking

The ordered list of group members based on rating.

Ranking is group-scoped.

### Rating snapshot

The stored before/after rating information for a match and its players.

Snapshots make historical matches explainable even after future matches change current ratings.

### Recalculation

A full recomputation of ratings across a group's match history.

Used when historical order can be affected, such as:

- editing a match;
- deleting a match;
- creating a retroactive match.

### Append-only rating update

A fast path used when creating a match at the end of the group timeline.

Instead of recalculating every historical match, BeachRank calculates only the new match from current member ratings and updates the four affected members.

## Feed

### Feed

A ranked list of relevant moments for the signed-in user.

The feed should not be treated as a raw activity log. It should surface interesting product moments.

Examples:

- group creation;
- member joined;
- dominant win;
- future close match;
- future upset win;
- future ranking climb;
- future milestones.

### Feed item

A persisted event or moment shown in the feed.

Feed items contain:

- type;
- scope;
- visibility;
- actor;
- subject;
- optional group;
- optional match;
- metadata;
- importance score;
- occurrence date.

### Feed event type

The technical enum that identifies a feed item.

Examples:

- `GROUP_CREATED`
- `MEMBER_JOINED`
- `MATCH_BLOWOUT`

### Feed title

The user-facing name or heading shown for a feed item.

Example:

- technical type: `MATCH_BLOWOUT`
- UI title: `Atropelo!`

### Atropelo!

The user-facing feed moment for a dominant match result.

Technical type: `MATCH_BLOWOUT`.

Current rule: generated when the winning team wins by `6-0` or `6-1`.

The UI should show the score from the winning team's perspective, even if the winner was `TEAM_B`.

Examples:

- stored score: `0-6`; displayed as `6-0`.
- stored score: `1-6`; displayed as `6-1`.

### Visibility

Defines who can see a feed item.

Current values:

- `GROUP_MEMBERS`
- `SOCIAL_CIRCLE`
- `PUBLIC`
- `PRIVATE`

Use the narrowest visibility that satisfies the product need.

### Importance score

A base relevance score stored with the feed item.

This is not the only ordering mechanism. Feed readers can combine it with recency or other ranking signals.

### Feed score

A calculated score used to sort feed items for display.

Currently derived by the feed reader from stored importance and occurrence date.

## UX and navigation

### Contextual skeleton

A loading state that visually resembles the destination screen.

Preferred for route transitions and screen-level data loading.

### Global loading indicator

A lightweight app-level loading indicator, such as a top progress bar.

This can support navigation feedback, but should not be the main loading experience when a destination screen can show a contextual skeleton.

### Public profile

The profile view shown when viewing another user.

The viewer may only see data allowed by product and privacy rules.

### Own profile

The profile view shown to the signed-in user for themselves.

Own profile can include controls and private/self-only information that public profiles should not show.
