import type { Match, MatchParticipant } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';

type MatchesListProps = {
  matches: Match[];
  emptyTitle?: string;
  emptyDescription?: string;
};

export function MatchesList({
  matches,
  emptyTitle = 'Nenhuma partida registrada',
  emptyDescription = 'Quando houver partidas, elas aparecem aqui.',
}: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </section>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const teamA = getTeamParticipants(match, 'TEAM_A');
  const teamB = getTeamParticipants(match, 'TEAM_B');

  const teamAWon = match.gamesA > match.gamesB;
  const winningTeam = teamAWon ? teamA : teamB;
  const winningDelta = getAverageDelta(winningTeam);

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <MatchTeam names={formatTeamNames(teamA)} score={match.gamesA} isWinner={teamAWon} />

            <MatchTeam names={formatTeamNames(teamB)} score={match.gamesB} isWinner={!teamAWon} />

            <p className="text-xs text-muted-foreground">{formatDate(match.playedAt)}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-3xl font-semibold tracking-tight">
              {match.gamesA}–{match.gamesB}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">{formatDelta(winningDelta)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchTeam({
  names,
  score,
  isWinner,
}: {
  names: string;
  score: number;
  isWinner: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isWinner ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
        }`}
      >
        {score}
      </div>

      <p className={`truncate text-sm ${isWinner ? 'font-semibold' : 'text-muted-foreground'}`}>
        {names}
      </p>
    </div>
  );
}

function getTeamParticipants(match: Match, team: 'TEAM_A' | 'TEAM_B') {
  return match.participants
    .filter((participant) => participant.team === team)
    .sort((a, b) => a.position - b.position);
}

function formatTeamNames(participants: MatchParticipant[]) {
  if (participants.length === 0) {
    return 'Dupla não encontrada';
  }

  return participants.map((participant) => participant.displayNameSnapshot).join(' / ');
}

function getAverageDelta(participants: MatchParticipant[]) {
  if (participants.length === 0) {
    return 0;
  }

  const total = participants.reduce((sum, participant) => sum + participant.ratingDelta, 0);

  return total / participants.length;
}

function formatDelta(delta: number) {
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}
