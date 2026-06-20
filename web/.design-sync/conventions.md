# Arena — how to build with this design system

Arena is a mobile-first, **dark-first** product (casual beach-tennis groups:
rankings, matches, ratings). Components are React + Tailwind v4 utilities driven
by CSS-variable tokens. Build with the real components below; do your own layout
with the token utilities — never hard-code colors, sizes, or fonts.

## Setup — required, or everything renders wrong

1. **Render under `.dark`.** The Arena look IS the dark theme; `:root` is a light
   fallback. Put `className="dark"` on your app root (the real app sets it on
   `<body>`). Without it you get the unbranded light token set.
2. **Brand face: Plus Jakarta Sans** (the single face, weights 500–800). Load it
   and map `--font-plus-jakarta` to it, e.g.
   `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">`
   then `:root { --font-plus-jakarta: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }`.
   Apply `font-sans` (or `font-display`) on the root.

A minimal correct shell:

```jsx
<div className="dark font-sans bg-background text-foreground min-h-screen">
  <Card className="w-80">
    <CardHeader>
      <Eyebrow className="text-muted-foreground">Sua posição</Eyebrow>
      <CardTitle><Title>Caio Ribeiro</Title></CardTitle>
      <CardAction><Stat>1248</Stat></CardAction>
    </CardHeader>
    <CardContent className="text-muted-foreground">12 partidas · 8 vitórias</CardContent>
    <CardFooter><Button size="sm" variant="secondary">Ver histórico</Button></CardFooter>
  </Card>
</div>
```

## The styling idiom — token utilities (use these names, don't invent)

- **Surfaces:** `bg-background` `bg-card` `bg-surface` `bg-surface-hover` `bg-popover` `bg-muted`
- **Text/ink ramp:** `text-foreground` `text-muted-foreground` `text-faint-foreground` `text-dim-foreground` `text-card-foreground`
- **Brand & semantic:** `bg-primary text-primary-foreground` · `text-brand` `text-brand-muted` `bg-brand/15` · `text-success bg-success/15` · `text-danger bg-danger/15`
- **Type scale** (size + weight + tracking baked in — pair with `font-display` for the scoreboard look): `text-display` `text-stat-lg` `text-stat` `text-title` `text-section` `text-action` `text-body` `text-body-strong` `text-label` `text-support` `text-eyebrow` `text-caption` `text-micro`
- **Radii:** `rounded-pill` (controls) · `rounded-card` `rounded-hero` · `rounded-sm/md/lg/xl/2xl/3xl/4xl`
- **Elevation** (a hairline is always an inset shadow, never a `border`): `shadow-hairline` `shadow-control` `shadow-card` `shadow-button` `shadow-float`
- **Fonts:** `font-sans` `font-display` `font-heading` (all the one face)

Prefer the typographic role components over raw classes for figures and headings:
`Display` (hero rank `#3`), `Stat` (ratings/scores, `size="lg"`), `Title`,
`Section`, `Eyebrow` (uppercase overline). `Typography*` (H1–H4, P, Lead, Large,
Small, Muted, List, Blockquote, InlineCode) covers running prose.

## Components (window.Arena)

Actions `Button` · Forms `Input` `Textarea` `Label` `InputGroup` (+`Addon`/`Input`/`Button`/`Text`) `Toggle` `ToggleGroup` `Select` `Combobox` · Content `Card` (+`Header`/`Title`/`Description`/`Content`/`Footer`/`Action`) `Badge` `Avatar` (+`Image`/`Fallback`/`Group`/`Badge`) `Separator` `RatingRing` `Tabs` (+`List`/`Trigger`/`Content`) · Overlays `Dialog` `AlertDialog` `DropdownMenu` `Popover` `Command`. Compose compounds from their parts (e.g. a `Card` with header/content/footer; `Tabs` with `TabsList`/`TabsTrigger`/`TabsContent`).

`Button` variants: `default` (brand) `secondary` `outline` `ghost` `destructive` `link`; sizes `lg/default/sm/xs` + `icon*`. `Badge` variants: `default` `secondary` `outline` `brand` `success` `danger` `ghost` `link`.

## Where the truth lives

Read `styles.css` and its `@import` closure (the compiled token + utility sheet)
before styling, and the per-component `<Name>.prompt.md` / `<Name>.d.ts` for each
component's API and examples.
