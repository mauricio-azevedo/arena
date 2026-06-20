import * as React from 'react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Arena typographic roles.
 *
 * A single face (Plus Jakarta Sans) carries everything — headings and figures
 * at heavy weights, running text lighter. Numbers use `tabular-nums` so stats
 * stay column-aligned. Each role reads its size, weight and tracking from the
 * type-scale tokens in globals.css — never hard-code them.
 */

type RoleProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  asChild?: boolean;
};

/** The single anchoring figure on a screen — e.g. the rank `#5`. */
function Display({ className, asChild, ...props }: RoleProps<'div'>) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="display"
      className={cn('font-display text-display tabular-nums', className)}
      {...props}
    />
  );
}

/** Secondary figures — scores, ratings, ring values. `size="lg"` for 26px. */
function Stat({
  className,
  asChild,
  size = 'default',
  ...props
}: RoleProps<'div'> & { size?: 'default' | 'lg' }) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="stat"
      className={cn(
        'font-display tabular-nums',
        size === 'lg' ? 'text-stat-lg' : 'text-stat',
        className,
      )}
      {...props}
    />
  );
}

/** Screen / group title. */
function Title({ className, asChild, ...props }: RoleProps<'h1'>) {
  const Comp = asChild ? Slot.Root : 'h1';
  return (
    <Comp data-slot="title" className={cn('font-display text-title', className)} {...props} />
  );
}

/** In-page section header — e.g. "Hoje". */
function Section({ className, asChild, ...props }: RoleProps<'h2'>) {
  const Comp = asChild ? Slot.Root : 'h2';
  return (
    <Comp data-slot="section" className={cn('font-display text-section', className)} {...props} />
  );
}

/** Uppercase overline that sits above a value — e.g. "SUA POSIÇÃO". */
function Eyebrow({ className, asChild, ...props }: RoleProps<'div'>) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      data-slot="eyebrow"
      className={cn('text-eyebrow text-muted-foreground uppercase', className)}
      {...props}
    />
  );
}

export { Display, Stat, Title, Section, Eyebrow };
