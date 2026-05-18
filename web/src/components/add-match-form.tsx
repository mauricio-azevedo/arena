'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/api';
import type { Player } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Props = {
  players: Player[];
};

export function AddMatchForm({ players }: Props) {
  const router = useRouter();

  const [teamAPlayer1Id, setTeamAPlayer1Id] = useState('');
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState('');
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState('');
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState('');
  const [gamesA, setGamesA] = useState('0');
  const [gamesB, setGamesB] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedPlayerIds = useMemo(
    () => [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id].filter(Boolean),
    [teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id],
  );

  const winner = getWinner(Number(gamesA), Number(gamesB));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

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

    try {
      await createMatch({
        teamAPlayer1Id,
        teamAPlayer2Id,
        teamBPlayer1Id,
        teamBPlayer2Id,
        gamesA: parsedGamesA,
        gamesB: parsedGamesB,
      });

      setTeamAPlayer1Id('');
      setTeamAPlayer2Id('');
      setTeamBPlayer1Id('');
      setTeamBPlayer2Id('');
      setGamesA('6');
      setGamesB('4');
      setMessage('Partida salva.');

      router.refresh();
    } catch {
      setMessage('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSection
          scoreLabel="A"
          scoreValue={gamesA}
          onScoreChange={setGamesA}
          isWinner={winner === 'A'}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          player1Id={teamAPlayer1Id}
          player2Id={teamAPlayer2Id}
          onPlayer1Change={setTeamAPlayer1Id}
          onPlayer2Change={setTeamAPlayer2Id}
        />

        <div className="flex items-center justify-center text-muted-foreground">
          <X className="size-5" aria-hidden="true" />
        </div>

        <TeamSection
          scoreLabel="B"
          scoreValue={gamesB}
          onScoreChange={setGamesB}
          isWinner={winner === 'B'}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          player1Id={teamBPlayer1Id}
          player2Id={teamBPlayer2Id}
          onPlayer1Change={setTeamBPlayer1Id}
          onPlayer2Change={setTeamBPlayer2Id}
        />
      </div>

      {message && <p className="px-1 text-center text-sm text-muted-foreground">{message}</p>}

      <p className="text-center text-sm text-muted-foreground">
        Se terminar no tiebreak, registre como 7–6.
      </p>

      <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar partida'}
      </Button>
    </form>
  );
}

type TeamSectionProps = {
  scoreLabel: string;
  scoreValue: string;
  onScoreChange: (value: string) => void;
  isWinner: boolean;
  players: Player[];
  selectedPlayerIds: string[];
  player1Id: string;
  player2Id: string;
  onPlayer1Change: (value: string) => void;
  onPlayer2Change: (value: string) => void;
};

function TeamSection({
  scoreLabel,
  scoreValue,
  onScoreChange,
  isWinner,
  players,
  selectedPlayerIds,
  player1Id,
  player2Id,
  onPlayer1Change,
  onPlayer2Change,
}: TeamSectionProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
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

      <ScoreInput
        label={scoreLabel}
        value={scoreValue}
        onChange={onScoreChange}
        isWinner={isWinner}
      />
    </div>
  );
}

type PlayerSelectProps = {
  players: Player[];
  selectedPlayerIds: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function PlayerSelect({
  players,
  selectedPlayerIds,
  value,
  onChange,
  placeholder,
}: PlayerSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedPlayer = players.find((player) => player.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 w-full justify-between font-normal"
        >
          <span className="truncate">{selectedPlayer ? selectedPlayer.name : placeholder}</span>

          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar jogador..." />

          <CommandList>
            <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>

            <CommandGroup>
              {players.map((player) => {
                const isSelected = player.id === value;
                const isSelectedElsewhere = selectedPlayerIds.includes(player.id) && !isSelected;

                return (
                  <CommandItem
                    key={player.id}
                    value={player.name}
                    disabled={isSelectedElsewhere}
                    onSelect={() => {
                      if (isSelectedElsewhere) return;

                      onChange(player.id);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{player.name}</span>

                    <Check
                      className={cn('ml-auto size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ScoreInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isWinner: boolean;
};

const scoreOptions = ['0', '1', '2', '3', '4', '5', '6', '7'];

function ScoreInput({ label, value, onChange, isWinner }: ScoreInputProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={`Placar ${label}`}
        className={cn(
          'relative h-14! w-full justify-center text-3xl font-semibold',
          '[&>svg]:absolute [&>svg]:right-3 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2',
          isWinner && 'border-foreground',
          'mb-0',
        )}
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {scoreOptions.map((score) => (
          <SelectItem key={score} value={score}>
            {score}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function getWinner(gamesA: number, gamesB: number) {
  if (Number.isNaN(gamesA) || Number.isNaN(gamesB)) return null;
  if (gamesA === gamesB) return null;

  return gamesA > gamesB ? 'A' : 'B';
}
