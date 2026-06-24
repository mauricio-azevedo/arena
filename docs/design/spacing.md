# Spacing

Arena spaces elements on an **8-point grid** (4px base unit, 8px primary step) — the
system behind Material, Apple's HIG, Polaris, and Atlassian. A consistent rhythm is
part of product quality: when every gap is one of a few deliberate values, screens feel
calm and built by one hand instead of negotiated pixel by pixel.

## The semantic ladder

The space **between elements** (gaps and margins) uses named tokens, not raw numbers, so
off-grid values are simply unavailable and the recurring relationships change together.
The tokens live in the `@theme` block of `app/globals.css` and Tailwind v4 turns each into
a full set of utilities (`gap-snug`, `space-y-section`, `mt-comfortable`, `gap-x-tight`, …).

| Token         | px  | Utilities                               | Use for                                  |
| ------------- | --- | --------------------------------------- | ---------------------------------------- |
| `tight`       | 4   | `gap-tight`, `mt-tight`                 | label↔value, icon↔text, intra-line pairs |
| `snug`        | 8   | `gap-snug`, `space-y-snug`              | related items in a row, chip gaps        |
| `base`        | 12  | `space-y-base`, `gap-base`              | compact vertical rhythm inside a card    |
| `comfortable` | 16  | `space-y-comfortable`, `mt-comfortable` | heading↔card, footer stacks              |
| `section`     | 24  | `space-y-section`                       | between major page sections              |
| `loose`       | 32  | `space-y-loose`                         | hero / drawer-internal blocks            |
| `page`        | 48  | `pt-page`                               | page-level gaps (rare)                   |

Keep the three vertical scales distinct so a screen reads as a hierarchy:
**section (24) > heading↔card (16) > intra-card (12)**.

## Rules

- **Gaps and margins use the ladder.** No `.5` Tailwind steps (`gap-1.5`, `space-y-3.5`)
  and no arbitrary `[18px]` spacing — both are off the grid. Snap to the nearest token.
- **Padding stays numeric Tailwind** (`p-4`, `px-4`, `py-3`). Padding is component-internal
  tuning, often owned by a primitive, so it may use any Tailwind step — including small `.5`
  values on chips/badges/controls where optical balance needs them. The one ban that still
  applies to padding: **no arbitrary `[Npx]`** (snap `px-[18px]` → `px-4`).
- **Card padding is owned by `--card-spacing`** (20px default / 16px `size="sm"`) in
  `components/ui/card.tsx`. Don't re-specify card padding at call sites. 20px is a legal grid
  step that exists only for card internals — it has no ladder name.
- **On-grid numerics without a name are allowed for incidental layout** — e.g. `space-y-5`
  (20px) or `gap-7` (28px) when no token fits. Prefer a token when one does.
- **2px optical exception.** A `mt-0.5` (2px) nudge is allowed _only_ to tuck a line of type
  under the line above it (a `Meta` under a `Title`), where snapping to 4px would read as a
  layout gap. It must carry a one-line comment and never be used as structural spacing.

## Rollout

Adopted screen by screen, like the visual style:

- **Done:** profile (+ edit drawer), home, groups.
- **Next:** the remaining surfaces (auth, claim flow, notifications) as they're touched —
  sweep any `.5` / `[px]` spacing onto the ladder.

When you build or restyle a screen, bring its spacing onto the ladder in the same pass.
