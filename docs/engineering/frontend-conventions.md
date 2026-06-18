# Frontend Conventions (Next.js / `web`)

Observed conventions in `web/src` (verified 2026-06-17). Descriptive companion to
[`../code-organization.md`](../code-organization.md).

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui
(`radix-luma` style), lucide icons. Mobile-first, dark theme by default,
Portuguese copy (`lang="pt-BR"`).

---

## 1. Directory layout

```txt
web/src/
  app/        routes (page.tsx, loading.tsx, layout.tsx) — thin
  components/ globally shared UI (app-shell, bottom-nav, ui/* shadcn primitives)
  features/   product features (the bulk of the code)
  lib/        infrastructure (api-client, auth, utils, route-policy, hrefs)
  providers/  React context providers (navigation)
  types/      cross-feature API contract types (api.ts)
```

`lib/` must not import from `features/`. Feature-specific code never goes in the
global `components/`.

## 2. Feature structure

Each feature has a **root component at the feature root** (`profile.tsx`,
`group-detail.tsx`) and only the subfolders it needs:

```txt
features/<feature>/
  <feature>.tsx           root component
  api/<x>.api.ts          API calls (functions only)
  components/             reusable pieces within the feature
  sections/              larger page blocks
  tabs/<tab>/            subfeatures with their own api/sections/types
  types/<x>.type.ts      one important type per file
  enums/<x>.enum.ts      closed unions (`type X = 'A' | 'B'`)
  helpers/<x>.helper.ts  pure functions
```

File names are kebab-case with suffix; components are PascalCase; named exports
only (except route files, which need `default`).

## 3. Routes (`app/`)

- `page.tsx` is a thin (usually server) component that fetches and renders a
  feature component inside `AppShell`. Dynamic params/searchParams arrive as
  Promises and are `await`ed.
- `'use client'` is pushed down to the feature/component that actually needs
  state, effects, browser APIs, or event handlers — not put on route files.
- `loading.tsx` co-locates a destination-shaped skeleton (wrapped in `AppShell`
  with the same chrome). See
  [`../design/loading-and-skeletons.md`](../design/loading-and-skeletons.md).

## 4. Data fetching & state

- **No React Query / SWR.** Server components `await` API functions directly and
  pass data as props to client components.
- Client components fetch in `useEffect` with a `'loading' | 'ready' | 'error'`
  state machine and an `isCurrent` flag to ignore stale responses.
- Every API call passes `cache: 'no-store'`.
- Standard render branches: loading → skeleton, error → error state, empty →
  empty state, else content.

## 5. API layer

- `lib/api-client.ts` exposes `apiRequest<T>(path, { token, body, ...opts })`:
  sets JSON headers, `Authorization: Bearer <token>` when provided, throws
  `Error(message)` on non-2xx (message extracted from the JSON body, arrays
  joined). Base URL from `NEXT_PUBLIC_API_URL`.
- `*.api.ts` files contain only functions named `get*/create*/update*/delete*`,
  typed with shared/feature types. No UI, no formatting, no `localStorage`.
- The JWT is passed **explicitly** into each call — it is not auto-injected.

```ts
export function getProfileMatches(token: string): Promise<ProfileMatchListItem[]> {
  return apiRequest<ProfileMatchListItem[]>('/me/profile/matches', { token, cache: 'no-store' });
}
```

## 6. Auth on the client

- `lib/auth.ts`: token in `localStorage` (`arena_access_token`), SSR-guarded
  (`typeof window === 'undefined'`), JWT decoded manually from the base64 payload
  to read `sub`. No auth library.

## 7. Types

- `types/api.ts` hand-mirrors the backend contract (`User`, `Group`,
  `GroupMember`, `Match`, `MatchPlayer`, …). **Keep it in sync with the API by
  hand** — there is no codegen or shared package.
- Features prefer lightweight view-model types over reusing full API types when
  they only need a subset.
- Enums are union types in `enums/*.enum.ts`
  (`type ProfileMatchResult = 'WIN' | 'LOSS'`), not the `enum` keyword.

## 8. Shared chrome, navigation, routing helpers

- `AppShell` wraps screens, enforces `lib/route-policy.ts` (access kind +
  chrome flags + group membership/role checks — UX only), renders `AppTopBar` +
  `BottomNav`.
- `providers/navigation-provider.tsx` keeps a sessionStorage nav stack for safe
  back behavior (`safeBack(fallbackHref)`); `navigation-tracker.tsx` registers the
  current href.
- `lib/internal-href.ts` rejects open redirects (only `/…`, not `//…` or external);
  `lib/search-params.ts` normalizes array params.

## 9. UI & styling

- shadcn/ui primitives in `components/ui/*` (configured by `components.json`).
- `cn()` from `lib/utils.ts` (`clsx` + `tailwind-merge`) for class composition.
- Tailwind v4 via `@tailwindcss/postcss`; theme tokens (oklch CSS variables) in
  `app/globals.css`; `dark` class on `<body>`.
- Loading skeletons use `animate-pulse` on muted blocks that match the final
  layout, with `role="status"` / `aria-busy` / `sr-only` text. No visible
  "Carregando…" text.

## 10. Product/UI quality bar

Follow the bar in `AGENTS.md`: ship-ready copy, no implementation/architecture
leaking into UI, intentional loading/empty/error states, mobile-first, elegant.
Tooling: `npm run dev`, `npm run build`, `npm run lint`.
</content>
