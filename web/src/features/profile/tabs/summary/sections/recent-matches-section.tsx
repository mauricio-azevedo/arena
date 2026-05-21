import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileSummaryMatch } from '../types/profile-summary-match.type';
import {
  formatProfileMatchResult,
  formatProfileMatchScore,
  formatProfileMatchTeams,
} from '../../../helpers/profile-match-format.helper';
import { formatProfileRelativeDate } from '../../../helpers/profile-date-format.helper';

type Props = {
  matches: ProfileSummaryMatch[];
  onViewAll: () => void;
};

export function RecentMatchesSection({ matches, onViewAll }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Últimas partidas</h2>

          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-muted-foreground"
          >
            Ver todas
          </button>
        </div>

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma partida registrada ainda.</p>
        ) : (
          <div className="divide-y">
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
  const teams = formatProfileMatchTeams(match);
  const result = formatProfileMatchResult(match.result);
  const isWin = match.result === 'WIN';

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {isWin ? 'V' : 'D'}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold leading-5">
          {teams.teamA} {formatProfileMatchScore(match)} {teams.teamB}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {match.groupName} · {result} · {formatProfileRelativeDate(match.playedAt)}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
