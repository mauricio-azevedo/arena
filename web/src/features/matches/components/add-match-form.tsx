'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GroupMember, Match } from '@/types/api';
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
import { createGroupMatch, updateGroupMatch } from '@/features/matches/matches.api';

const TOKEN_STORAGE_KEY = 'beachrank_access_token';

type Props = {
  groupId: string;
  members: GroupMember[];
  match?: Match;
};

function getInitialMemberId(match: Match | undefined, team: 'TEAM_A' | 'TEAM_B', position: number) {
  return (
    match?.participants.find(
      (participant) => participant.team === team && participant.position === position,
    )?.groupMemberId ?? ''
  );
}

export function AddMatchForm({ groupId, members, match }: Props) {
  const router = useRouter();

  const [teamAPlayer1Id, setTeamAPlayer1Id] = useState(getInitialMemberId(match, 'TEAM_A', 1));
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState(getInitialMemberId(match, 'TEAM_A', 2));
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState(getInitialMemberId(match, 'TEAM_B', 1));
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState(getInitialMemberId(match, 'TEAM_B', 2));
  const [gamesA, setGamesA] = useState(match ? String(match.gamesA) : '0');
  const [gamesB, setGamesB] = useState(match ? String(match.gamesB) : '0');
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

    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      setMessage('Entre na sua conta para registrar uma partida.');
      return;
    }

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
      const input = {
        teamAPlayer1Id,
        teamAPlayer2Id,
        teamBPlayer1Id,
        teamBPlayer2Id,
        gamesA: parsedGamesA,
        gamesB: parsedGamesB,
      };

      if (match) {
        await updateGroupMatch(token, groupId, match.id, input);
      } else {
        await createGroupMatch(token, groupId, input);
      }

      router.push(`/groups/${groupId}?tab=matches`);
      router.refresh();
    } catch {
      setMessage('Não foi possível salvar. Verifique se você faz parte deste grupo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (members.length < 4) {
    return (
      <div className="mt-6 rounded-2xl border p-4 text-sm text-muted-foreground">
        Este grupo precisa ter pelo menos 4 membros para registrar uma partida.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSection
          scoreLabel="A"
          scoreValue={gamesA}
          onScoreChange={setGamesA}
          isWinner={winner === 'A'}
          members={members}
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
          members={members}
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
        {isSubmitting ? 'Salvando...' : match ? 'Salvar correção' : 'Salvar partida'}
      </Button>
    </form>
  );
}

type TeamSectionProps = {
  scoreLabel: string;
  scoreValue: string;
  onScoreChange: (value: string) => void;
  isWinner: boolean;
  members: GroupMember[];
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
  members,
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
          members={members}
          selectedPlayerIds={selectedPlayerIds}
          placeholder="Jogador 1"
        />

        <PlayerSelect
          value={player2Id}
          onChange={onPlayer2Change}
          members={members}
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
  members: GroupMember[];
  selectedPlayerIds: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function PlayerSelect({
  members,
  selectedPlayerIds,
  value,
  onChange,
  placeholder,
}: PlayerSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedMember = members.find((member) => member.id === value);

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
          <span className="truncate">
            {selectedMember ? selectedMember.displayName : placeholder}
          </span>

          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar jogador..." />

          <CommandList>
            <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>

            <CommandGroup>
              {members.map((member) => {
                const isSelected = member.id === value;
                const isSelectedElsewhere = selectedPlayerIds.includes(member.id) && !isSelected;

                return (
                  <CommandItem
                    key={member.id}
                    value={member.displayName}
                    disabled={isSelectedElsewhere}
                    onSelect={() => {
                      if (isSelectedElsewhere) return;

                      onChange(member.id);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{member.displayName}</span>

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
