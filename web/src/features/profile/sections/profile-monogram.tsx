import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// The circular/rounded initial used across the profile (identity, hero, partner
// rows, group cards). Size, shape and fill come from the caller via className;
// this only owns the centering + heavy display figure.
export function ProfileMonogram({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}
