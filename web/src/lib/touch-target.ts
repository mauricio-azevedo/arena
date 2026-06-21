// Invisible hit-area expander (Apple HIG: ≥44pt tap target). Keeps a control's
// visual size but grows its tappable area via a centered `::after` pseudo-element,
// so small/elegant controls stay easy to hit without inflating their visuals.
//
// The presets are full literal class strings (no interpolation of the sizing
// utilities) so Tailwind keeps them in the build. Apply on the control itself.

const BASE =
  "relative after:absolute after:top-1/2 after:left-1/2 after:h-full after:w-full after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

/** Minimum 44px tap target — the Button default. */
export const TOUCH_TARGET_44 = `${BASE} after:min-h-11 after:min-w-11`;

/** Minimum 48px tap target — used by the denser match-drawer controls. */
export const TOUCH_TARGET_48 = `${BASE} after:min-h-12 after:min-w-12`;
