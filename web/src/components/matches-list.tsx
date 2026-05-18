'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import type { Match, Player } from '@/types/api';
import { deleteMatch, updateMatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  matches: Match[];
  players: Player[];
};

export function MatchesList({ matches, players }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  if (matches.length === 0) {
    return (
      <section className="mt-8">
        <p className="text-sm text-muted-foreground">Nenhuma partida registrada ainda.</p>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8 space-y-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onCorrect={() => setSelectedMatch(match)} />
        ))}
      </section>

      <CorrectMatchDialog
        match={selectedMatch}
        players={players}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}

function MatchCard({ match, onCorrect }: { match: Match; onCorrect: () => void }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const teamAWon = match.gamesA > match.gamesB;
  const winningDelta = teamAWon ? match.ratingDeltaA : match.ratingDeltaB;

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await deleteMatch(match.id);
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="relative">
        <CardContent className="p-4 pr-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8 text-muted-foreground"
                aria-label="Ações da partida"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCorrect}>Editar</DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setDeleteOpen(true);
                }}
              >
                Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <MatchTeam
                names={`${match.teamAPlayer1.name} / ${match.teamAPlayer2.name}`}
                score={match.gamesA}
                isWinner={teamAWon}
              />

              <MatchTeam
                names={`${match.teamBPlayer1.name} / ${match.teamBPlayer2.name}`}
                score={match.gamesB}
                isWinner={!teamAWon}
              />

              <p className="text-xs text-muted-foreground">{formatDate(match.createdAt)}</p>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar partida?</AlertDialogTitle>
            <AlertDialogDescription>
              Este lançamento será removido e o ranking será recalculado com o histórico restante.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Apagando...' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CorrectMatchDialog({
  match,
  players,
  onClose,
}: {
  match: Match | null;
  players: Player[];
  onClose: () => void;
}) {
  const router = useRouter();

  const [teamAPlayer1Id, setTeamAPlayer1Id] = useState('');
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState('');
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState('');
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState('');
  const [gamesA, setGamesA] = useState('');
  const [gamesB, setGamesB] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!match) return;

    setTeamAPlayer1Id(match.teamAPlayer1Id);
    setTeamAPlayer2Id(match.teamAPlayer2Id);
    setTeamBPlayer1Id(match.teamBPlayer1Id);
    setTeamBPlayer2Id(match.teamBPlayer2Id);
    setGamesA(String(match.gamesA));
    setGamesB(String(match.gamesB));
    setMessage(null);
  }, [match]);

  const selectedPlayerIds = useMemo(
    () => [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id].filter(Boolean),
    [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id],
  );

  async function handleSave() {
    if (!match) return;

    const playerIds = [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id];

    if (playerIds.some((id) => !id)) {
      setMessage('Selecione os quatro jogadores.');
      return;
    }

    if (new Set(playerIds).size !== 4) {
      setMessage('O mesmo jogador não pode aparecer duas vezes.');
      return;
    }

    const parsedGamesA = Number(gamesA);
    const parsedGamesB = Number(gamesB);

    if (
      Number.isNaN(parsedGamesA) ||
      Number.isNaN(parsedGamesB) ||
      parsedGamesA < 0 ||
      parsedGamesB < 0 ||
      parsedGamesA === parsedGamesB
    ) {
      setMessage('Informe um placar com vencedor. No tiebreak, use 7–6.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await updateMatch(match.id, {
        teamAPlayer1Id,
        teamAPlayer2Id,
        teamBPlayer1Id,
        teamBPlayer2Id,
        gamesA: parsedGamesA,
        gamesB: parsedGamesB,
      });

      onClose();
      router.refresh();
    } catch {
      setMessage('Não foi possível salvar a correção.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={Boolean(match)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Corrigir partida</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Use apenas para corrigir um lançamento errado.
          </p>
        </DialogHeader>

        <div className="space-y-5">
          <TeamEditor
            title="Dupla A"
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            player1Id={teamAPlayer1Id}
            player2Id={teamAPlayer2Id}
            onPlayer1Change={setTeamAPlayer1Id}
            onPlayer2Change={setTeamAPlayer2Id}
          />

          <TeamEditor
            title="Dupla B"
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            player1Id={teamBPlayer1Id}
            player2Id={teamBPlayer2Id}
            onPlayer1Change={setTeamBPlayer1Id}
            onPlayer2Change={setTeamBPlayer2Id}
          />

          <div className="space-y-3">
            <Label>Placar</Label>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <Input
                value={gamesA}
                onChange={(event) => setGamesA(event.target.value)}
                type="number"
                min="0"
                inputMode="numeric"
                className="h-14 text-center text-2xl font-semibold"
              />

              <span className="text-xl text-muted-foreground">–</span>

              <Input
                value={gamesB}
                onChange={(event) => setGamesB(event.target.value)}
                type="number"
                min="0"
                inputMode="numeric"
                className="h-14 text-center text-2xl font-semibold"
              />
            </div>
          </div>

          {message && <p className="text-center text-sm text-muted-foreground">{message}</p>}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamEditor({
  title,
  players,
  selectedPlayerIds,
  player1Id,
  player2Id,
  onPlayer1Change,
  onPlayer2Change,
}: {
  title: string;
  players: Player[];
  selectedPlayerIds: string[];
  player1Id: string;
  player2Id: string;
  onPlayer1Change: (value: string) => void;
  onPlayer2Change: (value: string) => void;
}) {
  return (
    <section className="space-y-3">
      <Label>{title}</Label>

      <div className="grid grid-cols-2 gap-2">
        <PlayerSelect
          value={player1Id}
          onChange={onPlayer1Change}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          placeholder="Jogador 1"
        />

        <PlayerSelect
          value={player2Id}
          onChange={onPlayer2Change}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          placeholder="Jogador 2"
        />
      </div>
    </section>
  );
}

function PlayerSelect({
  players,
  selectedPlayerIds,
  value,
  onChange,
  placeholder,
}: {
  players: Player[];
  selectedPlayerIds: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {players.map((player) => {
          const isSelectedElsewhere = selectedPlayerIds.includes(player.id) && player.id !== value;

          return (
            <SelectItem key={player.id} value={player.id} disabled={isSelectedElsewhere}>
              {player.name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
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

function formatDelta(delta: number) {
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}
