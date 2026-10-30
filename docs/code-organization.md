# Code Organization Guide

This document defines how code should be organized in Arena.

The goal is not to minimize the number of files.  
The goal is to keep the codebase explicit, predictable, scalable, and easy to navigate.

Arena should feel simple as a product, but the codebase should be structured like a serious production system.

---

## 1. References

This guide is inspired by:

- Next.js official project structure
- Bulletproof React
- Feature-Sliced Design, adapted
- NestJS official architecture
- Angular Style Guide for naming and consistency
- Google TypeScript Style Guide

These references are not followed blindly. Arena adapts them to its own product, stack, and domain.

---

## 2. Core principles

### 2.1 Feature-first organization

Code should be organized around product features and domain concepts, not around technical categories only.

Good:

```txt
features/profile
features/groups
features/feed
features/auth
```

Avoid:

```txt
components/
types/
helpers/
api/
```

as large global folders for feature-specific code.

Global folders are allowed only for truly shared infrastructure.

---

### 2.2 Domain before implementation

Before creating files, routes, schemas, or components, understand the domain.

For structural decisions, think through:

- entities;
- relationships;
- cardinality;
- ownership of data;
- permissions;
- privacy;
- edge cases;
- future consequences.

Do not design only from the current UI.

---

### 2.3 Local by default, shared by necessity

A file should live as close as possible to where it is used.

Only move code upward when it is used by more than one child area.

Example:

```txt
features/profile/tabs/matches/helpers/
```

is better than:

```txt
features/profile/helpers/
```

if the helper is used only by the matches tab.

Shared code should earn its place.

---

### 2.4 Explicit names over clever names

Prefer names that describe the business meaning.

Good:

```txt
profile-summary-tab.tsx
profile-matches.api.ts
group-created-feed-item.generator.ts
weekly-highlight.type.ts
```

Avoid vague names:

```txt
utils.ts
helpers.ts
types.ts
data.ts
service.ts
card.tsx
```

unless they are scoped enough that the meaning is obvious.

---

### 2.5 Root component at the feature root

Each frontend feature should have a main component at the feature root.

Good:

```txt
features/profile/profile.tsx
features/feed/home-feed.tsx
features/groups/groups.tsx
```

The `components/` folder contains child components used by the feature root or by subfeatures.

The main/root component should not be buried inside `components/`.

---

### 2.6 Components should not be dumping grounds

Components should focus on rendering and orchestration.

Do not place unrelated helpers, formatting functions, DTO definitions, route builders, or complex transformations inside component files.

Move them to:

```txt
helpers/
types/
enums/
api/
mappers/
```

as appropriate.

---

### 2.7 Prefer predictable structure over personal taste

When there are multiple valid ways to organize code, follow this guide.

Do not reorganize based on momentary preference unless the guide is updated.

---

## 3. Repository structure

Arena is a pnpm-workspaces monorepo (`pnpm-workspace.yaml` declares `apps/*` and `packages/*`):

```txt
arena/
  apps/
    api/
    web/
  packages/
    contracts/
  docs/
```

Turborepo (`turbo.json`) runs the workspace tasks in dependency order: `packages/*` build before
the apps, and the API's Prisma client is generated before anything that imports it.

### 3.1 `apps/api/`

Backend NestJS application.

```txt
apps/api/
  prisma/
  src/
```

### 3.2 `apps/web/`

Frontend Next.js application.

```txt
apps/web/
  src/
```

### 3.3 `packages/`

Shared workspace packages (`@arena/*`), consumed by the apps through `workspace:*` dependencies.
Built to `dist/` (the API's `tsc` cannot run a sibling package's `.ts`).

```txt
packages/contracts/
  src/
    api-errors.ts         API_ERROR_CODES, ApiErrorCode
    auth.ts               the account's own field schemas (name, nickname, email, avatar colour),
                          registerBodySchema + loginBodySchema, accountSchema +
                          authSessionResponseSchema; @arena/contracts/auth
    avatar-color.ts       AVATAR_COLOR_KEYS, AvatarColorKey, isAvatarColorKey
    claims.ts             claimEmailBodySchema, claimStubSummarySchema + claimMembershipSchema +
                          claimResultResponseSchema + claimEmailStateSchema +
                          claimOfferDetailResponseSchema and their types;
                          @arena/contracts/claims, the claim shapes both invite controllers
                          and `claim-offers` answer
    feed-item-type.ts     feedItemTypeSchema, FeedItemType; leaf
    group-member-role.ts  groupMemberRoleSchema, GroupMemberRole; leaf
    groups.ts             groupBodySchema, groupSchema + groupMembershipResponseSchema +
                          groupHomeCardResponseSchema and their types; @arena/contracts/groups,
                          the membership payload served by `groups`, `me` and `users`
    index.ts              root export: api-errors + avatar-color
    invites.ts            inviteBodySchema + inviteAcceptBodySchema, createdInviteResponseSchema +
                          publicInviteResponseSchema (a union on `kind`) and their types;
                          @arena/contracts/invites
    iso-datetime.ts       isoDateTime codec (wire ISO string <-> API Date); leaf
    matches.ts            matchBodySchema + matchResponseSchema and their types; @arena/contracts/matches
    me.ts                 updateProfileBodySchema + updatePasswordBodySchema,
                          passwordUpdatedResponseSchema; @arena/contracts/me, and the auth session
                          the profile edit answers
    member-identity.ts    memberIdentitySchema (how a member is named and colored),
                          memberUserSchema, guestNameSchema; leaf
    members.ts            memberBodySchema + guestMemberBodySchema, groupMemberResponseSchema +
                          memberProfileResponseSchema; @arena/contracts/members
    profiles.ts           profileSummaryResponseSchema + profileMatchListItemSchema and their types;
                          @arena/contracts/profiles, served by `me` and `users`
    ranking.ts            rankingEntrySchema + rankingMovementSchema and their types;
                          @arena/contracts/ranking
    ranking-movement-direction.ts
                          rankingMovementDirectionSchema, RankingMovementDirection; leaf
```

`@arena/contracts` holds values both apps must agree on byte for byte. A constant goes there on
its second consumer, not before; a mirrored _rule_ with different code on each side (member display
name, password length) stays local. Request and response schemas are one file per API module, or
per resource when two modules serve the same shapes (`profiles.ts`: `me` and `users`), exported as
a subpath (`@arena/contracts/<module>`, `exports` in `package.json`), never from the root index:
the root is bundled into the web for its constants, and the CJS zod behind a schema cannot be
tree-shaken (64 locales, +95 kB gzipped per route when it was tried in #267). Module files import
leaves (`iso-datetime.ts`, `group-member-role.ts`, `member-identity.ts`,
`ranking-movement-direction.ts`, `feed-item-type.ts`) and each other one way, `invites` →
`claims` → `groups` → `ranking` → `members` → `profiles` → `matches` and `me` → `auth` (an
invite answers its target's claim summary and embeds a group, the group home standing reuses
`rankingMovementSchema`, `rankingEntrySchema` extends `groupMemberResponseSchema`, which reuses
the profile stats and match-list shapes, which reuse `matchTeamSchema`; `me` edits the account
`auth` creates, and the claim-email body is that account's own e-mail, so the field schemas and
the session response live with `auth`); a schema two modules need goes in a leaf, never a
cross-import that could cycle.

### 3.4 `docs/`

Project documentation.

```txt
docs/
  code-organization.md
```

Future docs may include:

```txt
docs/product-principles.md
docs/rating-system.md
docs/feed-system.md
docs/api-design.md
```

---

# Frontend organization

---

## 4. Frontend source structure

The frontend should follow this high-level structure:

```txt
apps/web/src/
  app/
  components/
  features/
  lib/
```

### 4.1 `app/`

Next.js routes, layouts, and route-level files.

Examples:

```txt
app/page.tsx
app/profile/page.tsx
app/groups/page.tsx
app/groups/[groupId]/page.tsx
```

Rules:

- `app/` should define routes.
- Route files should stay thin.
- Business/UI logic should live in `features/`.
- `page.tsx` should usually import and render a feature component.

Good:

```tsx
import { AppShell } from '@/components/app-shell';
import { Profile } from '@/features/profile/profile';

export default function ProfilePage() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}
```

Avoid putting full feature implementation inside `page.tsx`.

---

### 4.2 `components/`

Global shared UI components.

Only put components here if they are truly shared across unrelated features.

Examples:

```txt
components/ui/button.tsx
components/ui/card.tsx
components/app-shell.tsx
components/bottom-nav.tsx
components/page-header.tsx
```

Do not put feature-specific components here.

Bad:

```txt
components/profile-header.tsx
components/group-actions.tsx
components/add-match-form.tsx
```

Good:

```txt
features/profile/components/profile-header.tsx
features/groups/components/group-actions.tsx
features/matches/components/add-match-form.tsx
```

---

### 4.3 `features/`

Product features.

Examples:

```txt
features/auth
features/feed
features/groups
features/invites
features/matches
features/profile
features/search
features/users
```

A feature represents a product area, not just a UI component.

---

### 4.4 `lib/`

Low-level application utilities and infrastructure.

Examples:

```txt
lib/api-client.ts
lib/auth.ts
lib/utils.ts
```

Rules:

- `lib/` must not import from `features/`.
- `lib/` should not know product-specific UI.
- `lib/` may contain API primitives, token storage, generic utility functions, and framework glue.

---

## 5. Standard frontend feature structure

A normal feature should look like this:

```txt
features/example/
  example.tsx

  api/
    example.api.ts

  components/
    example-child.tsx

  sections/
    example-section.tsx

  helpers/
    example-format.helper.ts

  types/
    example.type.ts

  enums/
    example-status.enum.ts
```

Not every folder is required.

Only create folders that are needed.

---

## 6. Feature root component

Each feature should expose one main/root component.

Example:

```txt
features/profile/profile.tsx
```

The root component can:

- load base feature data;
- manage feature-level state;
- coordinate child components;
- render tabs or subfeatures;
- handle feature-level loading/error/signed-out states.

The root component should not:

- contain large formatting helpers;
- define exported types;
- contain API calls directly;
- contain large child sections inline;
- know details of every nested subfeature.

---

## 7. Components vs sections

### 7.1 Components

Use `components/` for reusable pieces inside a feature.

Examples:

```txt
components/profile-header.tsx
components/profile-tabs.tsx
components/profile-loading-state.tsx
components/profile-error-state.tsx
```

Components are usually smaller and reusable within the feature.

---

### 7.2 Sections

Use `sections/` for larger blocks of a screen.

Examples:

```txt
sections/recent-matches-section.tsx
sections/recent-groups-section.tsx
sections/profile-summary-stats-grid.tsx
```

A section usually represents a visible area of a page or tab.

Rules:

- Sections may compose components.
- Sections should not call APIs directly unless they are the root of a subfeature.
- Sections should not define domain types.

---

## 8. Tabs and subfeatures

When a feature has tabs that grow independently, each tab should become an internal subfeature.

Example:

```txt
features/profile/
  profile.tsx

  components/
    profile-header.tsx
    profile-tabs.tsx

  tabs/
    summary/
      profile-summary-tab.tsx
      api/
      sections/
      types/
      helpers/

    matches/
      profile-matches-tab.tsx
      api/
      sections/
      types/
      helpers/

    groups/
      profile-groups-tab.tsx

    stats/
      profile-stats-tab.tsx
```

Use this when each tab has:

- its own API;
- its own types;
- its own sections;
- its own loading logic;
- its own business behavior.

Do not promote tabs to top-level features unless they are used outside the parent feature.

Preferred:

```txt
features/profile/tabs/matches
```

Avoid unless truly independent:

```txt
features/profile-matches
```

---

## 9. API files on the frontend

API functions should live near the UI that uses them.

### 9.1 Feature-wide API

If an endpoint serves the entire feature shell, place it in:

```txt
features/profile/api/profile.api.ts
```

or, if the project chooses a flatter feature root:

```txt
features/profile/profile.api.ts
```

Example:

```txt
GET /me/profile
```

This returns data for the profile shell/header.

---

### 9.2 Tab-specific API

If an endpoint serves only one tab, place it inside that tab:

```txt
features/profile/tabs/matches/api/profile-matches.api.ts
```

Example:

```txt
GET /me/profile/matches
```

---

### 9.3 API file rules

API files should:

- export functions only;
- use `apiRequest`;
- not contain UI logic;
- not format data for display;
- not access `localStorage` directly unless explicitly responsible for auth;
- not define large types inline.

Good:

```ts
import type { ProfileMatchListItem } from '@arena/contracts/profiles';
import { apiRequest } from '@/lib/api-client';

export function getProfileMatches(token: string): Promise<ProfileMatchListItem[]> {
  return apiRequest<ProfileMatchListItem[]>('/me/profile/matches', {
    token,
    cache: 'no-store',
  });
}
```

---

## 10. Types on the frontend

API request and response shapes are never declared here: `import type` them from
`@arena/contracts/<module>` (`frontend-conventions.md` §7). `types/` holds view models, UI state
and the mirrors of modules not yet converted
(`features/weekly-highlights/types/weekly-highlight.type.ts`, `code-quality-backlog.md`).

### 10.1 Default rule

Use one file per important exported type.

Good:

```txt
profile-tab.type.ts
profile-match-base.type.ts
feed-item.type.ts
```

---

### 10.2 When to group types

Types may be grouped only when all conditions are true:

1. They are only used together.
2. They belong to the same view model or unconverted response.
3. They are small.
4. They are not imported independently by multiple areas.

Example:

```txt
profile-tab.type.ts
```

may contain:

```ts
export type ProfileTab = {
  label: string;
  href: string;
  badge: ProfileTabBadge | null;
};

type ProfileTabBadge = {
  count: number;
  highlighted: boolean;
};
```

But if `ProfileTabBadge` is imported elsewhere, it should get its own file.

---

### 10.3 When to split types

Create a separate file when the type:

- is imported by more than one file;
- represents a domain concept;
- is reused across tabs/features;
- is large enough to distract from the parent type.

Good:

```txt
types/profile-match-base.type.ts
types/profile-tab.type.ts
types/feed-item.type.ts
```

---

### 10.4 Avoid catch-all files

Avoid:

```txt
types.ts
api.types.ts
common.types.ts
models.ts
```

Use specific names:

```txt
profile-tab.type.ts
profile-match-base.type.ts
feed-item.type.ts
```

---

## 11. Enums and closed unions

Closed sets of values should live in `enums/`.

This applies even when implemented as TypeScript union types.

Sets the API owns are the exception: `z.enum` types in `@arena/contracts/<module>`
(`ProfileMatchResult`, `FeedItemType`), `import type` from there. A mirror of a module not yet
converted stays in `enums/` until that module moves.

Good:

```txt
enums/profile-tab-id.enum.ts
```

```ts
export type ProfileTabId = 'summary' | 'matches' | 'groups';
```

Also acceptable when a runtime enum is needed:

```ts
export enum ProfileTabId {
  Summary = 'summary',
  Matches = 'matches',
  Groups = 'groups',
}
```

Use union types when:

- runtime lookup is not needed;
- the enum is only used for typing.

Use runtime enums or constants when:

- values are iterated over;
- values are rendered in UI maps;
- values are used at runtime.

---

## 12. Helpers

Helpers must live in `helpers/`.

Do not define reusable helpers inside components.

Bad:

```tsx
function formatDate(date: string) {
  ...
}

export function ProfileMatchesList() {
  ...
}
```

Good:

```txt
helpers/profile-date-format.helper.ts
```

```ts
export function formatProfileRelativeDate(date: string | null) {
  ...
}
```

### 12.1 Helper naming

Use explicit names:

```txt
profile-date-format.helper.ts
profile-match-format.helper.ts
feed-item-text.helper.ts
feed-item-time.helper.ts
```

Avoid:

```txt
utils.ts
helpers.ts
format.ts
misc.ts
```

---

### 12.2 Helper scope

If used by one tab only:

```txt
features/profile/tabs/matches/helpers/
```

If used by multiple tabs inside profile:

```txt
features/profile/helpers/
```

If used by multiple unrelated features:

```txt
features/shared/helpers/
```

or:

```txt
lib/
```

Only move to global shared code when reuse is real.

---

## 13. Import rules

### 13.1 Allowed direction

A child folder may import from its parent shared folders.

Good:

```txt
profile/tabs/matches
→ imports from profile/helpers
→ imports from profile/types
```

A parent may import a child root component.

Good:

```txt
profile.tsx
→ imports profile-summary-tab.tsx
→ imports profile-matches-tab.tsx
```

A sibling tab should not import from another sibling tab.

Bad:

```txt
tabs/matches
→ imports from tabs/summary
```

If both need the same code, move it up to:

```txt
profile/helpers
profile/types
profile/enums
```

---

### 13.2 No circular dependencies

Avoid circular dependencies between:

- components;
- helpers;
- API files;
- types;
- tabs.

If a cycle appears, it usually means code belongs in a parent/shared folder.

---

## 14. Next.js Client and Server Component rules

### 14.1 Default to Server Components in routes

Route files in `app/` should stay server-compatible when possible.

### 14.2 Use Client Components only when needed

Add:

```tsx
'use client';
```

only when the file uses:

- `useState`;
- `useEffect`;
- browser APIs;
- event handlers;
- localStorage;
- client-side navigation hooks.

### 14.3 Client boundary placement

Prefer putting `'use client'` at the feature component level when the whole feature needs client behavior.

Avoid marking route files as client components unless necessary.

Good:

```txt
app/profile/page.tsx
→ server component

features/profile/profile.tsx
→ client component
```

---

## 15. Frontend naming conventions

### 15.1 Files

Use kebab-case with suffixes.

Examples:

```txt
profile-tabs.tsx
profile-summary-tab.tsx
profile-summary-stats-grid.tsx
profile-date-format.helper.ts
profile-tab.type.ts
profile-tab-id.enum.ts
profile-matches.api.ts
```

### 15.2 React components

Use PascalCase:

```tsx
export function ProfileTabs() {}
export function ProfileSummaryTab() {}
export function RecentMatchesSection() {}
```

### 15.3 Functions

Use camelCase:

```ts
formatProfileRelativeDate();
getProfileMatches();
buildUserProfileHref();
```

### 15.4 Types

Use PascalCase:

```ts
ProfileUser;
ProfileSummary;
ProfileMatchListItem;
```

### 15.5 No default exports except framework-required files

Use named exports by default.

Good:

```ts
export function Profile() {}
export type ProfileTab = {};
```

Exception:

Next.js route files require default exports:

```tsx
export default function ProfilePage() {}
```

---

# Backend organization

---

## 16. Backend source structure

The backend follows NestJS modules.

Standard module structure:

```txt
src/profile/
  profile.module.ts
  profile.controller.ts
  profile.service.ts

  types/
  helpers/
```

For larger modules:

```txt
src/me/
  me.module.ts
  me.controller.ts
  me.service.ts

  profile/
    profile.service.ts

  profile-summary/
    profile-summary.service.ts
    profile-summary-stats.service.ts
    profile-summary-matches.service.ts
    profile-summary-groups.service.ts

  profile-matches/
    profile-matches.service.ts

  types/
```

---

## 17. NestJS module rules

Each domain area should have a module.

Good:

```txt
auth/
feed/
groups/
group-invites/
matches/
members/
me/
ranking/
rating/
```

A module should contain:

- controller for HTTP entrypoints;
- services for business logic;
- types for internal contracts (§21);
- helper classes when needed.

---

## 18. Controller rules

Controllers should be thin.

Controllers may:

- define routes;
- apply guards;
- read params/body/current user;
- call services;
- return service results.

Controllers should not:

- contain business logic;
- query Prisma directly;
- calculate ratings;
- build complex response objects;
- make authorization decisions beyond guard/decorator wiring.

Good:

```ts
@Get('profile/matches')
@UseGuards(JwtAuthGuard)
getProfileMatches(@CurrentUser() user: AuthUser) {
  return this.profileMatches.findMatches(user.sub);
}
```

---

## 19. Service rules

Services contain business logic.

A service should have one clear responsibility.

Good:

```txt
profile-summary-stats.service.ts
→ calculates profile summary stats

profile-summary-matches.service.ts
→ fetches recent profile matches

profile-summary-groups.service.ts
→ fetches recent profile groups
```

Avoid one giant service that does everything.

Bad:

```txt
me.service.ts
→ profile
→ stats
→ matches
→ groups
→ privacy
→ feed
```

---

## 20. Backend subservices

When a module grows, split services by use case or responsibility.

Good:

```txt
feed/
  feed-reader.service.ts
  feed-writer.service.ts
  feed-score.service.ts
  feed-orchestrator.service.ts

  generators/
    group-created-feed-item.generator.ts
    member-joined-feed-item.generator.ts
```

Good:

```txt
me/
  profile-summary/
    profile-summary.service.ts
    profile-summary-stats.service.ts
    profile-summary-matches.service.ts
    profile-summary-groups.service.ts
```

---

## 21. Backend types and contracts

### 21.1 Request bodies and responses

No `dto/`. A request body is a zod schema and a response a `z.strictObject`, both in
`@arena/contracts/<module>` (ADR 0007, ADR 0008; rules in `backend-conventions.md` §5). Modules not
yet converted keep `*-input.type.ts` / `*-response.type.ts` in `types/`.

### 21.2 `types/`

Use `types/` for internal contracts and the inputs and responses of modules not yet converted.

Examples:

```txt
feed-item-draft.type.ts
claim-summary.type.ts
update-profile-input.type.ts
```

### 21.3 One important type per file

Backend follows the same default rule as frontend:

```txt
feed-item-draft.type.ts
feed-item-generator.type.ts
feed-player.type.ts
```

Small private helper types may remain inside the service file if they are not exported.

---

## 22. Backend helpers

Use `helpers/` for pure functions.

Examples:

```txt
rating/helpers/calculate-expected-score.helper.ts
matches/helpers/validate-match-score.helper.ts
feed/helpers/build-feed-item-metadata.helper.ts
```

Do not hide business workflows inside helpers.

A helper should be:

- pure or almost pure;
- easy to test;
- not dependent on Nest DI;
- not responsible for database writes.

If it needs dependencies or orchestration, make it a service.

---

## 23. Backend naming conventions

### 23.1 Files

Use kebab-case and Angular/Nest-style suffixes.

Examples:

```txt
groups.controller.ts
groups.service.ts
groups.module.ts
zod-validation.pipe.ts
profile-summary.service.ts
claim-summary.type.ts
group-created-feed-item.generator.ts
```

### 23.2 Classes

Use PascalCase with suffix.

Examples:

```ts
GroupsController;
GroupsService;
GroupsModule;
ProfileSummaryService;
GroupCreatedFeedItemGenerator;
```

### 23.3 Methods

Use camelCase and verbs.

Examples:

```ts
createGroup();
findUserFeed();
getProfileSummary();
calculateStats();
findRecentMatches();
```

---

## 24. Prisma rules

Prisma access should happen inside backend services.

Frontend must never know Prisma models directly.

Rules:

- do not expose raw Prisma objects if they contain unnecessary fields;
- map Prisma results to explicit response types;
- preserve historical snapshots when needed;
- keep domain consistency in services/generators;
- use transactions for multi-write workflows.

Example:

```txt
create group
→ create group
→ create admin membership
→ create feed item
```

should happen in one transaction.

---

## 25. Transactions

Use Prisma transactions when multiple writes must succeed or fail together.

Examples:

```txt
create group + create membership + create feed item
accept invite + update invite uses + create membership + create feed item
create match + update ratings + create feed item
delete match + recalculate ratings + delete feed items
```

Do not perform dependent writes separately unless inconsistency is acceptable.

---

## 26. API design rules

API routes should be organized by product/domain use case, not by visual component names.

Good:

```txt
GET /me/profile
GET /me/profile/summary
GET /me/profile/matches
GET /me/profile/groups
GET /me/profile/stats
```

Avoid:

```txt
GET /me/profile/header
GET /me/profile/stats-card
GET /me/profile/recent-section
```

Visual components can change. Use cases should remain stable.

---

## 27. Privacy and viewer context

When returning data about a user other than the authenticated user, services must consider viewer context.

For profile-like data, distinguish:

```txt
viewerUserId
profileUserId
```

Rules should be explicit.

Example:

```txt
A viewer may only see another user's matches in groups they share.
```

Do not assume that all profile data is public.

---

## 28. Feed-specific rules

Feed items are persisted domain events/moments.

A feed item should contain:

- type;
- scope;
- visibility;
- actor;
- subject;
- optional group;
- optional match;
- metadata;
- importance score;
- occurred date.

Feed generators should be separated by feed item type.

Good:

```txt
generators/group-created-feed-item.generator.ts
generators/member-joined-feed-item.generator.ts
generators/match-close-feed-item.generator.ts
```

Avoid one giant switch service that handles every event.

---

# TypeScript style

---

## 29. Exports

Use named exports.

Good:

```ts
export function getProfileMatches() {}
export type ProfileTab = {};
export class ProfileSummaryService {}
```

Avoid default exports except when required by the framework.

Allowed exception:

```tsx
export default function ProfilePage() {}
```

---

## 30. Imports

Prefer direct named imports.

Good:

```ts
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileUser } from '@arena/contracts/profiles';
```

Use `import type` for type-only imports.

Good:

```ts
import type { ProfileMatchListItem } from '@arena/contracts/profiles';
```

---

## 31. Type-only imports

Always use `import type` when importing only types.

Good:

```ts
import type { ProfileSummary } from '@arena/contracts/profiles';
```

Bad:

```ts
import { ProfileSummary } from '@arena/contracts/profiles';
```

---

## 32. Avoid overly broad imports

Avoid:

```ts
import * as profile from './types';
```

Prefer explicit imports:

```ts
import type { ProfileUser } from '@arena/contracts/profiles';
```

Namespace imports are allowed when they improve clarity or avoid excessive renamed imports.

---

## 33. Function size and responsibility

A function should do one thing.

If a function:

- validates;
- queries;
- maps;
- calculates;
- formats;
- mutates state;

all at once, split it.

---

## 34. Component size

A component should stay readable.

If a component contains:

- multiple visual blocks;
- multiple helper functions;
- multiple state machines;
- repeated JSX structures;

split it into sections/components/helpers.

---

## 35. Comments

Prefer clear code over comments.

Use comments for:

- non-obvious domain decisions;
- business rules;
- trade-offs;
- warnings;
- algorithm explanations.

Do not comment obvious code.

Bad:

```ts
// increments uses by 1
uses: {
  increment: 1;
}
```

Good:

```ts
// Rejoining a group should consume an invite use because the user becomes active again.
uses: {
  increment: 1;
}
```

---

# Decision rules

---

## 36. Where should a new file go?

Ask in this order:

1. Is this specific to one feature?
   - Put it inside that feature.

2. Is this specific to one tab/subfeature?
   - Put it inside that tab/subfeature.

3. Is this shared by multiple tabs within a feature?
   - Put it in the feature root shared folder.

4. Is this shared by multiple unrelated features?
   - Put it in a global shared location.

5. Is this framework/infrastructure code?
   - Put it in `lib/` or backend infrastructure module.

---

## 37. Should a type get its own file?

Create a file if:

- it is exported;
- it is imported by more than one file;
- it represents a domain concept;
- it represents an API contract;
- it is likely to grow.

It may stay grouped if:

- it is private to a file;
- it is tiny;
- it only exists to compose one parent type;
- it is not imported independently.

---

## 38. Should a helper be shared?

Keep helper local unless reuse is real.

Do not move helpers upward because they might be reused someday.

Move upward only when a second real usage appears or when the helper clearly belongs to a wider domain concept.

---

## 39. Should a folder be created?

Create a folder when it groups at least one clear concern.

Acceptable:

```txt
types/
helpers/
sections/
components/
api/
enums/
```

Avoid creating empty folders for hypothetical future needs.

---

## 40. Should a service be split?

Split a service when it has multiple reasons to change.

Examples:

```txt
FeedReaderService
FeedWriterService
FeedScoreService
```

are better than:

```txt
FeedService
```

if reading, writing, and scoring evolve independently.

---

# Examples

---

## 41. Good profile frontend structure

```txt
src/features/profile/
  profile.tsx

  api/
    profile.api.ts

  components/
    profile-header.tsx
    profile-tabs.tsx
    profile-loading-state.tsx
    profile-error-state.tsx
    profile-signed-out-state.tsx

  enums/
    profile-tab-id.enum.ts

  types/
    profile-tab.type.ts
    profile-match-base.type.ts

  helpers/
    profile-date-format.helper.ts
    profile-match-format.helper.ts

  tabs/
    summary/
      profile-summary-tab.tsx

      api/
        profile-summary.api.ts

      sections/
        profile-summary-stats-grid.tsx
        recent-matches-section.tsx
        recent-groups-section.tsx

    matches/
      profile-matches-tab.tsx

      api/
        profile-matches.api.ts

      sections/
        profile-matches-list.tsx

    groups/
      profile-groups-tab.tsx

    stats/
      profile-stats-tab.tsx
```

---

## 42. Good feed backend structure

```txt
src/feed/
  feed.module.ts
  feed.controller.ts

  feed-reader.service.ts
  feed-writer.service.ts
  feed-score.service.ts
  feed-orchestrator.service.ts

  generators/
    group-created-feed-item.generator.ts
    member-joined-feed-item.generator.ts
    match-close-feed-item.generator.ts
    match-blowout-feed-item.generator.ts
    upset-win-feed-item.generator.ts

  types/
    feed-item-draft.type.ts
    feed-item-generator.type.ts
    group-created-feed-input.type.ts
    member-joined-feed-input.type.ts
```

---

## 43. Good profile backend structure

```txt
src/me/
  me.module.ts
  me.controller.ts
  me.service.ts

  profile/
    profile.service.ts

  profile-summary/
    profile-summary.service.ts
    profile-summary-stats.service.ts
    profile-summary-matches.service.ts
    profile-summary-groups.service.ts

  profile-matches/
    profile-matches.service.ts

  profile-groups/
    profile-groups.service.ts

  profile-stats/
    profile-stats.service.ts

  types/
    update-profile-input.type.ts
    update-password-input.type.ts
```

---

# Anti-patterns

---

## 44. Avoid feature-specific code in global folders

Bad:

```txt
components/profile-header.tsx
types/profile-tab.type.ts
helpers/profile-date-format.helper.ts
```

Good:

```txt
features/profile/components/profile-header.tsx
features/profile/types/profile-tab.type.ts
features/profile/helpers/profile-date-format.helper.ts
```

---

## 45. Avoid large mixed files

Bad:

```txt
profile.tsx
```

containing:

- API calls;
- types;
- helpers;
- tab rendering;
- match formatting;
- group formatting;
- card components.

Good:

```txt
profile.tsx
components/
tabs/
helpers/
types/
api/
```

---

## 46. Avoid vague naming

Bad:

```txt
card.tsx
data.ts
utils.ts
types.ts
service.ts
```

Good:

```txt
profile-match-card.tsx
profile-matches.api.ts
profile-date-format.helper.ts
profile-tab.type.ts
profile-matches.service.ts
```

---

## 47. Avoid premature global sharing

Bad:

```txt
shared/helpers/date.helper.ts
```

when only the profile feature uses it.

Good:

```txt
features/profile/helpers/profile-date-format.helper.ts
```

Move it later only when another feature actually needs it.

---

## 48. Avoid UI-shaped backend endpoints

Bad:

```txt
GET /me/profile/header
GET /me/profile/recent-matches-card
GET /me/profile/stat-grid
```

Good:

```txt
GET /me/profile
GET /me/profile/summary
GET /me/profile/matches
```

---

# Final rule

When unsure, choose the structure that makes the domain clearer.

Good code organization should answer:

```txt
What product area is this?
Who owns this code?
What can import it?
What can change without breaking unrelated areas?
```

If the answer is unclear, the file probably belongs somewhere else.
