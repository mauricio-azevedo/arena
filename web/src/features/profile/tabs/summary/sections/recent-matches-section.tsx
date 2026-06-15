import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileSummaryMatch } from '../types/profile-summary-match.type';
import { formatProfileMatchResult } from '../../../helpers/profile-match-format.helper';
import { formatProfileRelativeDate } from '../../../helpers/profile-date-format.helper';
import { ProfileMatchPlayersInline } from '@/features/profile/components/profile-match-players-inline';
import { cn } from '@/lib/utils';

type Props = {
  matches: ProfileSummaryMatch[];
  onViewAll: () => void;
};

export function RecentMatchesSection({ matches, onViewAll }: Props) {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/8">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.035em]">Últimas partidas</h2>

          {matches.length > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10"
            >
              Ver todas
            </button>
          )}
        </div>

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma partida registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => (
              <RecentMatchRow key={match.id} match={match} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentMatchRow({ match }: { match: ProfileSummaryMatch }) {
  const result = formatProfileMatchResult(match.result);
  const isWin = match.result === 'WIN';
  const teamAWon = match.winnerTeam === 'TEAM_A';
  const teamBWon = match.winnerTeam === 'TEAM_B';

  return (
    <article className="rounded-[1.5rem] bg-white/42 p-3 ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold leading-none',
            isWin
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
          )}
        >
          {result}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="rounded-[1.25rem] bg-background/70 px-3 py-2.5 dark:bg-background/35">
            <MatchTeamLine players={match.teamA} score={match.gamesA} isWinner={teamAWon} />
            <div className="my-2 h-px bg-border/60" />
            <MatchTeamLine players={match.teamB} score={match.gamesB} isWinner={teamBWon} />
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            <GroupLink groupId={match.groupId}>{match.groupName}</GroupLink>
            {' · '}
            {formatProfileRelativeDate(match.playedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

function MatchTeamLine({
  players,
  score,
  isWinner,
}: {
  players: ProfileSummaryMatch['teamA'];
  score: number;
  isWinner: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
      <p
        className={cn(
          'min-w-0 text-sm leading-5',
          isWinner ? 'font-semibold text-foreground' : 'text-muted-foreground',
        )}
      >
        <ProfileMatchPlayersInline players={players} separator=" e " variant="inline" />
      </p>

      <span
        className={cn(
          'rounded-full px-2.5 py-1 text-sm font-bold leading-none tabular-nums',
          isWinner ? 'bg-primary/12 text-secondary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {score}
      </span>
    </div>
  );
}

function GroupLink({ groupId, children }: { groupId: string; children: string }) {
  return (
    <Link
      href={`/groups/${groupId}`}
      className="font-semibold text-secondary-foreground underline decoration-primary/35 decoration-1 underline-offset-[3px] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
    </Link>
  );
}
