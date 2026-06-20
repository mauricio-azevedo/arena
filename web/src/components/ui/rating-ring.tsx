import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type RatingRingProps = {
  /** Fill amount, 0–1. */
  progress: number;
  /** Outer diameter in px. */
  size?: number;
  className?: string;
  /** Centered content (value + caption). */
  children?: ReactNode;
};

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular progress indicator used for "distance to the next rank". The arc is
 * a brand gradient over a faint track; the center is free for a value + caption.
 */
export function RatingRing({ progress, size = 100, className, children }: RatingRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped);

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <defs>
          <linearGradient id="ratingRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ring-from)" />
            <stop offset="100%" stopColor="var(--ring-to)" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--surface)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="url(#ratingRingGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
