import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about our custom type-scale tokens. Without this it
// can't tell `text-eyebrow` / `text-body` / etc. apart from a text *color*,
// so combining a role token with a color in cn() (e.g. `text-eyebrow
// text-muted-foreground`) makes it drop one of them as a false conflict.
// Registering them as font-size keeps both — size token and color — intact.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'stat',
            'stat-lg',
            'title',
            'section',
            'body',
            'body-strong',
            'label',
            'support',
            'eyebrow',
            'caption',
            'micro',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}