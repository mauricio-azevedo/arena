'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Trash2 } from 'lucide-react';
import { deleteGroupMatch } from '@/lib/api';
import type { Match, MatchParticipant } from '@/types/api';
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

const TOKEN_STORAGE_KEY = 'beachrank_access_token';

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
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
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

  const teamA = getTeamParticipants(match, 'TEAM_A');
  const teamB = getTeamParticipants(match, 'TEAM_B');

  const teamAWon = match.gamesA > match.gamesB;
  const winningTeam = teamAWon ? teamA : teamB;
  const winningDelta = getAverageDelta(winningTeam);

  const showActions = Boolean(groupId && canManage);

  async function handleDelete() {
    if (!groupId) {
      return;
    }

    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

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
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir opções</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
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

        <CardContent className="p-4 pr-11">
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
