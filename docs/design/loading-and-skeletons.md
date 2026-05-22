# Loading and Skeleton UX

BeachRank should feel immediate, calm, and polished on mobile.

Loading behavior is part of product quality. A technically correct loading state can still feel broken if it appears in the wrong place or uses the wrong visual pattern.

## Core principle

When the user navigates to a new screen, the app should make the user feel that the destination was reached immediately.

Preferred pattern:

```txt
click/tap
→ route changes to destination context
→ destination screen shows contextual skeleton
→ data replaces skeleton
```

Avoid:

```txt
click/tap
→ user stays on previous screen
→ only global loading bar appears
→ destination appears after data is ready
```

The second pattern can make the button feel delayed or broken.

## Loading categories

### Route-level loading

Use when a route is waiting for server data before rendering.

Preferred solution in Next.js App Router:

```txt
app/<route>/loading.tsx
```

The loading screen should:

- use `AppShell` when appropriate;
- resemble the destination screen layout;
- use skeleton blocks instead of visible technical text;
- include accessible screen-reader text.

Example use case:

```txt
/groups/[groupId]/loading.tsx
```

When opening a group, the app should immediately show a group-detail skeleton, not keep the user on the previous list screen.

### Feature-level loading

Use inside client features when data loads after the route already rendered.

Examples:

- home feed;
- profile tabs;
- groups list;
- stats tab.

Preferred pattern:

- show a skeleton that resembles the relevant content;
- avoid visible text like `Carregando perfil...` unless there is no better visual option;
- keep screen-reader text with `sr-only`.

### Action-level loading

Use when the user performs a mutation inside the current screen.

Examples:

- saving a match;
- creating a group;
- generating an invite;
- logging out.

Preferred pattern:

- keep the user on the current screen;
- show loading on the button or affected block;
- disable the action if duplicate submissions would be harmful;
- keep the rest of the UI stable.

### Global navigation feedback

BeachRank uses a top progress indicator for immediate acknowledgement of internal navigation clicks.

This is useful as secondary feedback, but it should not be the only feedback for slow route transitions when a destination skeleton can be shown.

## Skeleton design rules

### Use destination-context skeletons

A skeleton should match the rough shape of the real screen.

Good examples:

- group detail skeleton with header, action buttons, tabs, and ranking rows;
- profile skeleton with profile hero, tabs, stat cards, and summary sections.

### Keep skeletons quiet

Skeletons should reduce anxiety, not draw too much attention.

Use:

- muted blocks;
- subtle `animate-pulse`;
- rounded shapes matching real components;
- realistic spacing.

Avoid:

- large spinners as the only state;
- loud copy;
- layout jumps;
- skeletons that look unrelated to the destination screen.

### Preserve layout stability

Skeleton size should be close to final content size.

This reduces layout shift when data loads.

### Keep accessibility text

A skeleton should include screen-reader-only status text when it represents a loading state.

Example:

```tsx
<div role="status" aria-live="polite" aria-busy="true">
  <span className="sr-only">Carregando perfil</span>
  ...skeleton blocks...
</div>
```

Do not remove accessible labels just because visible loading text is not shown.

## Recommended patterns by scenario

| Scenario | Pattern |
|---|---|
| Navigating to group detail | Route-level `loading.tsx` with group-detail skeleton |
| Navigating to public profile | Route-level profile skeleton when server data is pending |
| Switching tabs with already-loaded data | Local selected tab state; do not trigger server navigation |
| Switching tabs that fetch client-side data | Switch tab immediately, show tab-content skeleton |
| Saving forms | Button loading state and disabled duplicate submit |
| Fetching a list | List-shaped skeleton or card skeletons |
| Empty result | Real empty state, not skeleton |
| Error result | Real error state with recovery path |

## Copy rules

Avoid visible technical loading copy when a skeleton can communicate the state.

Avoid:

```txt
Carregando...
Verificando acesso...
Redirecionando...
```

Prefer:

- skeleton blocks for sighted users;
- `sr-only` labels for assistive technology.

Visible loading text is acceptable when:

- the wait is a deliberate long-running operation;
- the user needs to understand what is happening;
- no visual skeleton can represent the state well.

## Navigation and browser history

For tabs, prefer local UI state when all tab content is already loaded.

If the URL should reflect the selected tab, use `history.replaceState` when changing tabs should not trigger a new server fetch.

Use real navigation when:

- the user is moving to a new screen;
- the destination should have its own route-level loading;
- the destination data is not already available.

## Anti-patterns

### Previous-screen waiting

The user taps a destination but stays on the old screen until the new route is fully ready.

This makes the tap feel delayed.

Fix with route-level loading or destination skeleton.

### Text-only loading cards

A card that only says `Carregando grupos...` feels unfinished.

Fix with card/list skeletons.

### Fake instant navigation without state

Do not visually switch to a destination if there is no route/context/state to support it.

Prefer a real route-level `loading.tsx` for route transitions.

## QA checklist

For every new screen or slow transition, verify:

- tapping a link gives immediate feedback;
- the destination context appears quickly;
- skeleton resembles the final screen;
- no protected/private content flashes before auth checks finish;
- loading text is not visible unless intentional;
- screen-reader label exists for loading states;
- no major layout shift occurs when data loads;
- browser back still returns to the expected context.
