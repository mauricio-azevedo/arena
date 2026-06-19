import { ArrowDown, ArrowUp } from 'lucide-react';

import { RatingRing } from '@/components/ui/rating-ring';
import { Display, Eyebrow, Stat } from '@/components/ui/text';

export type StandingCardProps = {
  /** 1-based rank, or null when the viewer has no ranked position yet. */
  rank: number | null;
  /** Ring fill, 0–1 (position within the band to the rank above). */
  progress: number;
  /** Rating points needed to reach the rank above; null when already leading. */
  pointsToClimb: number | null;
  /** Current rating. */
  rating: number;
  /** The viewer's most recent rating change (net of its day); null hides the column. */
  lastChange: { delta: number; occurredAt: string } | null;
  /** Latest ranking movement (from the most recent match). */
  movement?: { direction: 'UP' | 'DOWN'; positions: number } | null;
};

export function StandingCard({
  rank,
  progress,
  pointsToClimb,
  rating,
  lastChange,
  movement,
}: StandingCardProps) {
  const isLeading = pointsToClimb === null;
  const chasingRank = rank !== null && rank > 1 ? rank - 1 : null;

  return (
    <div className="relative overflow-hidden rounded-hero border border-divider bg-card p-5 shadow-card">
      {/* depth wash, bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.22),transparent_68%)]"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <Eyebrow size="md">Sua posição</Eyebrow>
          <Display className="mt-2">{rank !== null ? `#${rank}` : '—'}</Display>
          {movement && <RankMovement movement={movement} />}
        </div>

        <RatingRing progress={isLeading ? 1 : progress}>
          {isLeading ? (
            <div className="text-caption font-bold uppercase tracking-wider text-brand-muted">
              No topo
            </div>
          ) : (
            <>
              <div className="font-display text-stat-lg leading-none text-foreground tabular-nums">
                {pointsToClimb}
              </div>
              <div className="mt-1 text-micro text-muted-foreground">
                pts p/ <span className="font-bold text-foreground">#{chasingRank}</span>
              </div>
            </>
          )}
        </RatingRing>
      </div>

      <div className="relative my-4 h-px bg-divider" />

      <div className="relative flex items-end justify-between">
        <div>
          <Eyebrow>Rating atual</Eyebrow>
          <Stat className="mt-1">{Math.round(rating)}</Stat>
        </div>
        {lastChange && (
          <div className="text-right">
            <Eyebrow>{formatRelativeDay(lastChange.occurredAt)}</Eyebrow>
            <Stat className={`mt-1 ${lastChange.delta < 0 ? 'text-danger' : 'text-success'}`}>
              {formatDelta(lastChange.delta)}
            </Stat>
          </div>
        )}
      </div>
    </div>
  );
}

function RankMovement({ movement }: { movement: { direction: 'UP' | 'DOWN'; positions: number } }) {
  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <div
      className={`mt-2.5 flex items-center gap-1 text-label font-bold ${isUp ? 'text-success' : 'text-danger'}`}
    >
      <Icon className="size-3.5" strokeWidth={2.8} aria-hidden />
      {movement.positions} {movement.positions === 1 ? 'posição' : 'posições'}
    </div>
  );
}

function formatDelta(delta: number) {
  // Use a true minus sign for negatives to match the display face's figures.
  return delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`;
}

// Instagram-style relative day label for the last rating change.
function formatRelativeDay(occurredAt: string) {
  const then = new Date(occurredAt);
  const thenStart = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const now = new Date();
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.max(0, Math.round((nowStart.getTime() - thenStart.getTime()) / 86_400_000));

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;

  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'Há 1 semana' : `Há ${weeks} semanas`;
}
