'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
    <section className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} groupId={groupId} canManage={canManage} />
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
  const winningTeam = teamAWon ? teamA : teamB;
  const winningDelta = getAverageDelta(winningTeam);

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
      <Card className="relative">
        {showActions && (
          <div className="absolute right-3 top-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
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
          </div>
        )}

        <CardContent className="space-y-4 p-4 pr-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Partida
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(match.playedAt)}</p>
            </div>

            <div className="rounded-[1.5rem] bg-muted px-3 py-2 text-right">
              <p className="text-2xl font-semibold leading-none tracking-[-0.04em] text-foreground">
                {match.gamesA}–{match.gamesB}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDelta(winningDelta)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <MatchTeam players={teamA} score={match.gamesA} isWinner={teamAWon} />
            <MatchTeam players={teamB} score={match.gamesB} isWinner={!teamAWon} />
          </div>
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
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          isWinner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {score}
      </div>

      <p className={`truncate text-sm ${isWinner ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        <MatchPlayerNames players={players} />
      </p>
    </div>
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
          <UserNameLink userId={player.groupMember?.userId}>{getPlayerDisplayName(player)}</UserNameLink>
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

function getAverageDelta(players: MatchPlayer[]) {
  if (players.length === 0) {
    return 0;
  }

  const total = players.reduce((sum, player) => sum + player.ratingDelta, 0);

  return total / players.length;
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

function getPlayerDisplayName(player: MatchPlayer) {
  const user = player.groupMember?.user;

  if (!user) {
    return 'Jogador';
  }

  return `${user.firstName} ${user.lastName}`.trim();
}
