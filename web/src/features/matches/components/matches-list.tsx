'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
import type { Match, MatchPlayer } from '@/types/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

  const winnerPlayers = teamAWon ? teamA : teamB;
  const loserPlayers = teamAWon ? teamB : teamA;
  const winnerScore = teamAWon ? match.gamesA : match.gamesB;
  const loserScore = teamAWon ? match.gamesB : match.gamesA;

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
      <Card className="pt-2 pb-4">
        <CardContent className="px-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
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

          <div className="mt-3">
            <MatchTeam players={winnerPlayers} isWinner />
            <MatchScore winnerScore={winnerScore} loserScore={loserScore} />
            <MatchTeam players={loserPlayers} isWinner={false} />
          </div>

          <MatchExpectedResult match={match} teamAWon={teamAWon} />
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

function MatchTeam({ players, isWinner }: { players: MatchPlayer[]; isWinner: boolean }) {
  const teamRating = getTeamRating(players);

  return (
    <div className="space-y-3">
      {teamRating !== null && (
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Rating <span className="tabular-nums">{teamRating}</span>
        </p>
      )}

      <div className="space-y-3">
        {players.map((player) => (
          <MatchPlayerRow key={player.id} player={player} isWinner={isWinner} />
        ))}
      </div>
    </div>
  );
}

function MatchPlayerRow({ player, isWinner }: { player: MatchPlayer; isWinner: boolean }) {
  const delta = Math.round(player.ratingDelta);

  return (
    <div className="flex items-center gap-3">
      <Avatar className={`ring-1 ${isWinner ? 'ring-emerald-500/40' : 'ring-border'}`}>
        <AvatarFallback
          className={
            isWinner
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground'
          }
        >
          {getPlayerInitial(player)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium tracking-wide ${
            isWinner ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <UserNameLink userId={player.groupMember?.userId}>
            {getPlayerDisplayName(player)}
          </UserNameLink>
        </p>

        <p
          className={`mt-1 font-mono text-[11px] uppercase tracking-wide ${
            isWinner ? 'text-muted-foreground' : 'text-muted-foreground/60'
          }`}
        >
          Rating <span className="tabular-nums">{Math.round(player.ratingBefore)}</span>
          {delta !== 0 && (
            <span
              className={`ml-1 font-semibold tabular-nums ${
                delta > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </p>
      </div>

      <MatchPlayerRank rankBefore={player.rankBefore} rankAfter={player.rankAfter} />
    </div>
  );
}

function MatchScore({ winnerScore, loserScore }: { winnerScore: number; loserScore: number }) {
  return (
    <div className="my-4 flex items-center gap-4">
      <span className="h-px flex-1 bg-linear-to-l from-foreground/10 to-border" />

      <div className="flex items-center gap-3 rounded-2xl bg-foreground px-5 py-2 text-2xl font-semibold tabular-nums text-background shadow-[0_6px_16px_color-mix(in_oklch,var(--foreground)_18%,transparent)]">
        <span className="text-background">{winnerScore}</span>
        <X className="h-4 w-4 text-muted-foreground" strokeWidth={3} aria-hidden="true" />
        <span className="text-muted-foreground">{loserScore}</span>
      </div>

      <span className="h-px flex-1 bg-linear-to-r from-foreground/10 to-transparent" />
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
  const { winnerGames, loserGames } = getExpectedScoreline(favoriteProbability);

  const expectedWinnerGames = winnerWasFavorite ? winnerGames : loserGames;
  const expectedLoserGames = winnerWasFavorite ? loserGames : winnerGames;

  return (
    <div className="mt-6 space-y-2 border-t border-border pt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Resultado esperado
        </p>

        <p className="text-sm font-semibold tabular-nums">
          <span
            className={
              expectedWinnerGames >= expectedLoserGames
                ? 'text-foreground'
                : 'text-muted-foreground'
            }
          >
            {expectedWinnerGames}
          </span>{' '}
          <span className="text-muted-foreground">–</span>{' '}
          <span
            className={
              expectedLoserGames > expectedWinnerGames ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {expectedLoserGames}
          </span>
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

// Placares de vitória válidos. Jogo até 6 games (7 no tiebreak):
// 6-0, 6-1, 6-2, 6-3, 6-4, 6-5 e 7-6.
const VALID_SCORELINES = [
  { winnerGames: 7, loserGames: 6 }, // fração 0,538
  { winnerGames: 6, loserGames: 5 }, // fração 0,545
  { winnerGames: 6, loserGames: 4 }, // fração 0,600
  { winnerGames: 6, loserGames: 3 }, // fração 0,667
  { winnerGames: 6, loserGames: 2 }, // fração 0,750
  { winnerGames: 6, loserGames: 1 }, // fração 0,857
  { winnerGames: 6, loserGames: 0 }, // fração 1,000
];

// A fração de games é a forma "realizada" da probabilidade no modelo de rating
// (delta = K * (fração − probabilidade), o mesmo eixo da narrativa). Então o placar
// esperado é o resultado válido cuja fração de games mais se aproxima da chance de vitória.
function getExpectedScoreline(favoriteProbability: number) {
  return VALID_SCORELINES.reduce((closest, scoreline) => {
    const share = scoreline.winnerGames / (scoreline.winnerGames + scoreline.loserGames);
    const closestShare = closest.winnerGames / (closest.winnerGames + closest.loserGames);

    return Math.abs(share - favoriteProbability) < Math.abs(closestShare - favoriteProbability)
      ? scoreline
      : closest;
  });
}

function MatchPlayerRank({
  rankBefore,
  rankAfter,
}: {
  rankBefore: number | null;
  rankAfter: number | null;
}) {
  if (rankAfter === null) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {rankBefore !== null && rankBefore !== rankAfter ? (
        <span className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-xs text-muted-foreground">#{rankBefore}</span>
          <span className="text-xs text-muted-foreground/50">→</span>
          <span className="text-lg font-semibold text-foreground">#{rankAfter}</span>
        </span>
      ) : (
        <span className="text-lg font-semibold tabular-nums text-foreground">#{rankAfter}</span>
      )}

      <RankMovementBadge rankBefore={rankBefore} rankAfter={rankAfter} />
    </div>
  );
}

function RankMovementBadge({
  rankBefore,
  rankAfter,
}: {
  rankBefore: number | null;
  rankAfter: number | null;
}) {
  if (rankAfter === null) {
    return null;
  }

  // Sem posição anterior (estreia) ou sem mudança: indicador neutro.
  if (rankBefore === null || rankBefore === rankAfter) {
    return (
      <span
        aria-label="Sem mudança no ranking"
        title="Sem mudança no ranking"
        className="inline-flex min-w-9 items-center justify-center rounded-full bg-muted px-1.5 py-1 text-[11px] font-bold leading-none text-muted-foreground"
      >
        –
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
    <span
      aria-label={label}
      title={label}
      className={`inline-flex min-w-9 items-center justify-center gap-0.5 rounded-full px-1.5 py-1 text-[11px] font-bold leading-none ${badgeClassName}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {positions}
    </span>
  );
}

function getTeamPlayers(match: Match, team: 'TEAM_A' | 'TEAM_B') {
  return match.players
    .filter((player) => player.team === team)
    .sort((a, b) => a.position - b.position);
}

// Rating da dupla na hora da partida: soma dos jogadores antes do resultado.
function getTeamRating(players: MatchPlayer[]) {
  if (players.length === 0) {
    return null;
  }

  const total = players.reduce((sum, player) => sum + player.ratingBefore, 0);

  return Math.round(total);
}

function getPlayerInitial(player: MatchPlayer) {
  const user = player.groupMember?.user;

  if (!user) {
    return '?';
  }

  return (user.firstName.charAt(0) || '?').toUpperCase();
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
