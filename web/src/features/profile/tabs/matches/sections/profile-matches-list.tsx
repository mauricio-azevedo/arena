import { Card, CardContent } from '@/components/ui/card';
import { ProfileMatchListItem } from '@/features/profile/tabs/matches/types/profile-match-list-item.type';
import {
  formatProfileMatchResult,
  formatProfileMatchScore,
} from '@/features/profile/helpers/profile-match-format.helper';
import { formatProfileRelativeDate } from '@/features/profile/helpers/profile-date-format.helper';
import { ProfileMatchPlayersInline } from '@/features/profile/components/profile-match-players-inline';
import { cn } from '@/lib/utils';

type Props = {
  matches: ProfileMatchListItem[];
};

export function ProfileMatchesList({ matches }: Props) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Nenhuma partida registrada ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3" aria-label="Partidas do perfil">
      {matches.map((match) => (
        <ProfileMatchCard key={match.id} match={match} />
      ))}
    </section>
  );
}

function ProfileMatchCard({ match }: { match: ProfileMatchListItem }) {
  const result = formatProfileMatchResult(match.result);
  const isWin = match.result === 'WIN';
  const ratingDelta = match.ratingDelta;

  return (
    <Card className="rounded-[1.75rem] bg-gradient-to-br from-card via-card to-primary/8">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold leading-none',
                  isWin
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
                )}
              >
                {result}
              </span>

              <p className="truncate text-xs text-muted-foreground">
                {match.groupName} · {formatProfileRelativeDate(match.playedAt)}
              </p>
            </div>

            <p className="text-sm font-semibold leading-5 text-foreground">
              <ProfileMatchPlayersInline players={match.teamA} /> {formatProfileMatchScore(match)}{' '}
              <ProfileMatchPlayersInline players={match.teamB} />
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-white/42 px-3 py-2.5 text-xs text-muted-foreground ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
          <span>
            Rating {Math.round(match.ratingBefore)} → {Math.round(match.ratingAfter)}
          </span>

          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 font-bold leading-none',
              ratingDelta >= 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
            )}
          >
            {ratingDelta >= 0 ? '+' : ''}
            {ratingDelta.toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
