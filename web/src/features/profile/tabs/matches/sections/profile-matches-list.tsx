import { Card, CardContent } from '@/components/ui/card';
import { ProfileMatchListItem } from '@/features/profile/tabs/matches/types/profile-match-list-item.type';
import {
  formatProfileMatchResult,
  formatProfileMatchScore,
  formatProfileMatchTeams,
} from '@/features/profile/helpers/profile-match-format.helper';
import { formatProfileRelativeDate } from '@/features/profile/helpers/profile-date-format.helper';

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
    <section className="space-y-3">
      {matches.map((match) => (
        <ProfileMatchCard key={match.id} match={match} />
      ))}
    </section>
  );
}

function ProfileMatchCard({ match }: { match: ProfileMatchListItem }) {
  const teams = formatProfileMatchTeams(match);
  const result = formatProfileMatchResult(match.result);
  const isWin = match.result === 'WIN';

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">
              {teams.teamA} {formatProfileMatchScore(match)} {teams.teamB}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {match.groupName} · {formatProfileRelativeDate(match.playedAt)}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
              isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {result}
          </span>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>
            Rating {match.ratingBefore.toFixed(0)} → {match.ratingAfter.toFixed(0)}
          </span>

          <span className={match.ratingDelta >= 0 ? 'text-green-700' : 'text-red-700'}>
            {match.ratingDelta >= 0 ? '+' : ''}
            {match.ratingDelta.toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
