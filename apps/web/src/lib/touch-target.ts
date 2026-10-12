// Invisible hit-area expander (≥48px tap target — the platform floor). Keeps a
// control's visual size but grows its tappable area via a centered `::after`
// pseudo-element, so small/elegant controls stay easy to hit without inflating
// their visuals.
//
// The preset is a full literal class string (no interpolation of the sizing
// utilities) so Tailwind keeps it in the build. Apply on the control itself.

const BASE =
  "relative after:absolute after:top-1/2 after:left-1/2 after:h-full after:w-full after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

/** Minimum 48px tap target — the platform floor. */
export const TOUCH_TARGET_48 = `${BASE} after:min-h-12 after:min-w-12`;
