# Arena design-sync — re-sync notes

Project: **Arena Design System** (`c85c2bd6-fb7b-4189-87d6-a2386008730b`).
Synced from `web/` (config home: `web/.design-sync/`).

## This repo is a Next.js APP, not a component library

- No `dist/` and no Storybook. The converter runs in **package shape** off a
  hand-written **barrel entry** (`.design-sync/ds-entry.ts`) passed via
  `--entry`, which makes `PKG_DIR` resolve up to `web/`. `pkg` is `"web"`,
  `globalName` is `"Arena"`.
- Components are discovered from `componentSrcMap` (no shipped `.d.ts`), curated
  to ~38 top-level cards in 5 groups (Actions/Forms/Content/Overlays/Typography).
  Subcomponents (CardHeader, DialogContent, …) are NOT cards but ARE in the
  bundle via the barrel's `export *`, so previews compose them.
- **Do NOT symlink `node_modules/web` → the package.** It was deliberately
  avoided: a self-referential symlink in the live `node_modules` can break
  `next dev` / tsserver. The barrel `--entry` is what fixes `PKG_DIR` instead.

## Tailwind v4 — the CSS must be compiled

- Utilities are generated on-demand, so `cfg.cssEntry` points at a COMPILED
  sheet: `.design-sync/.cache/arena.css` (gitignored, regenerated).
- `cfg.buildCmd` runs the Tailwind CLI on `.design-sync/tailwind-input.css`
  → it inlines `src/app/globals.css` (tokens + dark theme), scans
  `src/**`, `previews/**`, `runtime/**`, `safelist.tsx`, and remote-imports the
  brand font. **Run `cfg.buildCmd` before the converter on every re-sync.**
- `.design-sync/safelist.tsx` force-emits the full Arena token-utility
  vocabulary (bg-/text-/border- for every token, the type scale, radii,
  shadows, fonts) so designs built on claude.ai/design — which receive only
  `styles.css` — can use the classes the conventions document. Regenerate with
  `.ds-sync/gen-safelist.mjs` if tokens change in `globals.css`.

## Dark-first + font wiring (the preview provider)

- `cfg.provider = ArenaRoot` (`.design-sync/runtime/arena-root.tsx`, merged via
  `extraEntries`). It wraps every card in `.dark`, applies `font-sans` + the
  brand surface, AND promotes `.dark` onto `<html>`/`<body>` in a `useEffect`
  so Radix **portaled** overlays (Dialog/Popover/DropdownMenu/Select/Combobox)
  stay dark.
- Plus Jakarta Sans loads via a remote Google Fonts `@import` → validate prints
  `[FONT_REMOTE]` (informational, expected). `--font-plus-jakarta` is pinned in
  `tailwind-input.css`.

## Render check

- No Playwright Chromium is cached here; the render check uses **system Chrome**
  via `DS_CHROMIUM_PATH=/usr/bin/google-chrome`. Only the `playwright` npm lib is
  installed in `.ds-sync` (browser download skipped). Prefix validate/capture/
  driver commands with that env var.

## Overlay & wide-card overrides

- `cardMode: column` — Card, InputGroup, Tabs (wide multi-export).
- `cardMode: single` + `primaryStory: Open` — Select, Popover, DropdownMenu,
  Dialog, AlertDialog, Combobox (open content via `defaultOpen`). Command uses
  `primaryStory: Palette` (renders inline).

## Known render warns

None — 38/38 render cleanly.

## Re-sync risks (watch list)

- **The DS is still being created.** As of this sync only the
  `groups/[id]?tab=matches` screen was blessed by the owner; previews and the
  conventions header were anchored to it. Components elsewhere may still change —
  re-sync after the DS firms up; the verdict diff will re-verify changed ones.
- Previews use `defaultOpen` for overlays and `bg-#181920` literal in ArenaRoot
  (the dark `--background`); if the dark background token changes, update the
  literal in `arena-root.tsx`.
- The `.ds-sync/gen-*.mjs` helper scripts are NOT committed (staged dir is
  gitignored and re-copied from the skill bundle). The durable OUTPUTS are
  committed (config.json, previews/, groups/, safelist.tsx, conventions.md), so
  re-sync needs the helpers only if regenerating from scratch.
- The barrel `ds-entry.ts` is hand-maintained: add a line if a new
  `src/components/ui/*` file should ship, and add its components to
  `componentSrcMap` (+ a `groups/<Name>.md` stub for grouping).
