'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Match, MatchPlayer } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteGroupMatch } from '@/features/matches/api/matches.api';
import { getMatchNarrativeTitle } from '@/features/matches/lib/match-narrative-title';
import { UserNameLink } from '@/features/users/components/user-name-link';
import { getAccessToken } from '@/lib/auth';

type MatchesListProps = {
  matches: Match[];
  groupId?: string;
  canManage?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function MatchesList({
  matches,
  groupId,
  canManage = false,
  emptyTitle = 'Nenhuma partida registrada',
  emptyDescription = 'Quando houver partidas, elas aparecem aqui.',
}: MatchesListProps) {
  const matchGroups = groupMatchesByDate(matches);

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          <p className="text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      {matchGroups.map((group) => (
        <div key={group.dateKey} className="space-y-3">
          <div className="sticky top-0 z-20">
            <p className="inline-flex rounded-full bg-background/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-xs">
              {group.label}
            </p>
          </div>

          <div className="space-y-3">
            {group.matches.map((match) => (
              <MatchCard key={match.id} match={match} groupId={groupId} canManage={canManage} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function MatchCard({
  match,
  groupId,
  canManage,
}: {
  match: Match;
  groupId?: string;
  canManage: boolean;
}) {
  const router = useRouter();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const teamA = getTeamPlayers(match, 'TEAM_A');
  const teamB = getTeamPlayers(match, 'TEAM_B');

  const teamAWon = match.gamesA > match.gamesB;
  const narrativeTitle = getMatchNarrativeTitle(match);

  const showActions = Boolean(groupId && canManage);

  async function handleDelete() {
    if (!groupId) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError('Entre na sua conta para apagar a partida.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteGroupMatch(token, groupId, match.id);
      setIsConfirmOpen(false);
      router.refresh();
    } catch {
      setError('Não foi possível apagar a partida.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-foreground">
              {narrativeTitle ?? 'Partida'}
            </p>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Abrir opções</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      if (!groupId) return;

                      router.push(`/groups/${groupId}/matches/${match.id}/edit`);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Corrigir lançamento
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(event) => {
                      event.preventDefault();
                      setIsConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar lançamento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-2">
            {teamAWon ? (
              <>
                <MatchTeam players={teamA} score={match.gamesA} isWinner />
                <MatchTeam players={teamB} score={match.gamesB} isWinner={false} />
              </>
            ) : (
              <>
                <MatchTeam players={teamB} score={match.gamesB} isWinner />
                <MatchTeam players={teamA} score={match.gamesA} isWinner={false} />
              </>
            )}
          </div>

          <MatchExpectedResult match={match} teamAWon={teamAWon} />

          <MatchRankingSection players={teamAWon ? [...teamA, ...teamB] : [...teamB, ...teamA]} />
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta partida será removida e o ranking do grupo será recalculado com o histórico
              restante.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {isDeleting ? 'Apagando...' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MatchTeam({
  players,
  score,
  isWinner,
}: {
  players: MatchPlayer[];
  score: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-[1.5rem] px-3 py-2.5 ${
        isWinner ? 'bg-muted text-foreground' : 'bg-background/65 text-muted-foreground'
      }`}
    >
      <p
        className={`min-w-0 flex-1 truncate text-sm ${isWinner ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
      >
        <MatchPlayerNames players={players} />
      </p>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          isWinner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {score}
      </div>
    </div>
  );
}

function MatchExpectedResult({ match, teamAWon }: { match: Match; teamAWon: boolean }) {
  const { teamAExpected, teamBExpected } = match;

  if (teamAExpected === null || teamBExpected === null) {
    return null;
  }

  const winnerExpected = teamAWon ? teamAExpected : teamBExpected;

  // A barra representa a chance de vitória (probabilidade de Elo), não fração de games.
  const winnerPercent = Math.round(winnerExpected * 100);
  const loserPercent = 100 - winnerPercent;

  // O placar esperado é um resultado válido (vencedor chega a 6, ou 7 no tiebreak).
  // A margem do favorito cresce com o favoritismo; o vencedor real pode ter sido o azarão.
  const winnerWasFavorite = winnerExpected >= 0.5;
  const favoriteProbability = Math.max(winnerExpected, 1 - winnerExpected);
  const { favoriteGames, underdogGames } = getExpectedScoreline(favoriteProbability);

  const expectedWinnerGames = winnerWasFavorite ? favoriteGames : underdogGames;
  const expectedLoserGames = winnerWasFavorite ? underdogGames : favoriteGames;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Resultado esperado
        </p>

        <p className="text-sm font-semibold tabular-nums text-foreground">
          {expectedWinnerGames} <span className="text-muted-foreground">–</span> {expectedLoserGames}
        </p>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="rounded-full bg-emerald-500" style={{ width: `${winnerPercent}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs tabular-nums">
        <span className="text-foreground">{winnerPercent}%</span>
        <span className="text-muted-foreground">{loserPercent}%</span>
      </div>
    </div>
  );
}

// Placares de vitória válidos do favorito. Jogo até 6 games (7 no tiebreak):
// 6-0, 6-1, 6-2, 6-3, 6-4, 6-5 e 7-6.
const VALID_SCORELINES = [
  { favoriteGames: 7, underdogGames: 6 }, // fração 0,538
  { favoriteGames: 6, underdogGames: 5 }, // fração 0,545
  { favoriteGames: 6, underdogGames: 4 }, // fração 0,600
  { favoriteGames: 6, underdogGames: 3 }, // fração 0,667
  { favoriteGames: 6, underdogGames: 2 }, // fração 0,750
  { favoriteGames: 6, underdogGames: 1 }, // fração 0,857
  { favoriteGames: 6, underdogGames: 0 }, // fração 1,000
];

// A fração de games é a forma "realizada" da probabilidade no modelo de rating
// (delta = K * (fração − probabilidade), o mesmo eixo da narrativa). Então o placar
// esperado é o resultado válido cuja fração de games mais se aproxima da chance de vitória.
function getExpectedScoreline(favoriteProbability: number) {
  return VALID_SCORELINES.reduce((closest, scoreline) => {
    const share = scoreline.favoriteGames / (scoreline.favoriteGames + scoreline.underdogGames);
    const closestShare = closest.favoriteGames / (closest.favoriteGames + closest.underdogGames);

    return Math.abs(share - favoriteProbability) < Math.abs(closestShare - favoriteProbability)
      ? scoreline
      : closest;
  });
}

function MatchRankingSection({ players }: { players: MatchPlayer[] }) {
  const movedPlayers = players.filter(hasRankMovement);

  if (movedPlayers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Ranking
        </p>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        {movedPlayers.map((player) => (
          <MatchRankingRow key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

function hasRankMovement(player: MatchPlayer) {
  if (player.rankAfter === null) {
    return false;
  }

  // Estreia no ranking (sem posição anterior) também é uma mudança.
  if (player.rankBefore === null) {
    return true;
  }

  return player.rankBefore !== player.rankAfter;
}

function MatchRankingRow({ player }: { player: MatchPlayer }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 flex-1 truncate text-sm text-foreground">
        <UserNameLink userId={player.groupMember?.userId}>
          {getPlayerDisplayName(player)}
        </UserNameLink>
      </p>

      <MatchRankingChange rankBefore={player.rankBefore} rankAfter={player.rankAfter} />
    </div>
  );
}

function MatchRankingChange({
  rankBefore,
  rankAfter,
}: {
  rankBefore: number | null;
  rankAfter: number | null;
}) {
  if (rankAfter === null) {
    return null;
  }

  // Estreia no ranking: ainda não havia posição anterior.
  if (rankBefore === null) {
    return (
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        #{rankAfter}
      </span>
    );
  }

  const isUp = rankAfter < rankBefore;
  const positions = Math.abs(rankBefore - rankAfter);
  const Icon = isUp ? ArrowUp : ArrowDown;
  const badgeClassName = isUp
    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
    : 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
  const label = `${isUp ? 'Subiu' : 'Caiu'} ${positions} ${
    positions === 1 ? 'posição' : 'posições'
  }`;

  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex w-[4.5rem] items-center justify-between text-xs tabular-nums text-muted-foreground">
        <span>#{rankBefore}</span>
        <span className="text-muted-foreground/60">→</span>
        <span className="text-foreground">#{rankAfter}</span>
      </span>

      <span
        aria-label={label}
        title={label}
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${badgeClassName}`}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {positions}
      </span>
    </span>
  );
}

function MatchPlayerNames({ players }: { players: MatchPlayer[] }) {
  if (players.length === 0) {
    return <>Dupla não encontrada</>;
  }

  return (
    <>
      {players.map((player, index) => (
        <span key={player.id}>
          {index > 0 && ' / '}
          <UserNameLink userId={player.groupMember?.userId}>
            {getPlayerDisplayName(player)}
          </UserNameLink>
        </span>
      ))}
    </>
  );
}

function getTeamPlayers(match: Match, team: 'TEAM_A' | 'TEAM_B') {
  return match.players
    .filter((player) => player.team === team)
    .sort((a, b) => a.position - b.position);
}

function groupMatchesByDate(matches: Match[]) {
  const groups = new Map<string, Match[]>();

  for (const match of matches) {
    const dateKey = getDateKey(match.playedAt);
    const group = groups.get(dateKey);

    if (group) {
      group.push(match);
    } else {
      groups.set(dateKey, [match]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, groupMatches]) => ({
    dateKey,
    label: formatDateGroup(dateKey),
    matches: groupMatches,
  }));
}

function getDateKey(date: string) {
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateGroup(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const todayKey = getDateKey(today.toISOString());
  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  if (dateKey === todayKey) {
    return 'Hoje';
  }

  if (dateKey === getDateKey(yesterday.toISOString())) {
    return 'Ontem';
  }

  const isCurrentYear = date.getFullYear() === today.getFullYear();

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    ...(isCurrentYear ? {} : { year: 'numeric' }),
  });
}

function getPlayerDisplayName(player: MatchPlayer) {
  const user = player.groupMember?.user;

  if (!user) {
    return 'Jogador';
  }

  return `${user.firstName} ${user.lastName}`.trim();
}
