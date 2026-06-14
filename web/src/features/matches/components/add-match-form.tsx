'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GroupMember, Match } from '@/types/api';
import { Button } from '@/components/ui/button';
import { createGroupMatch, updateGroupMatch } from '@/features/matches/api/matches.api';
import { getAccessToken } from '@/lib/auth';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

type Props = {
  groupId: string;
  members: GroupMember[];
  match?: Match;
};

function getInitialMemberId(match: Match | undefined, team: 'TEAM_A' | 'TEAM_B', position: number) {
  return (
    match?.players.find((player) => player.team === team && player.position === position)
      ?.groupMemberId ?? ''
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

    const token = getAccessToken();

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
    } catch {
      setMessage('Não foi possível salvar. Verifique se você faz parte deste grupo.');
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
      <Card>
        <CardContent className="space-y-4">
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

          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <X className="size-5" aria-hidden="true" />
            <div className="h-px flex-1 bg-border" />
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
        </CardContent>
      </Card>

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PlayerSelect
          value={player1Id}
          onChange={onPlayer1Change}
          members={members}
          selectedPlayerIds={selectedPlayerIds}
          placeholder="Jogador 1"
        />
        /
        <PlayerSelect
          value={player2Id}
          onChange={onPlayer2Change}
          members={members}
          selectedPlayerIds={selectedPlayerIds}
          placeholder="Jogador 2"
        />
      </div>

      <ScoreInput label={scoreLabel} value={scoreValue} onChange={onScoreChange} />
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

type PlayerOption = {
  value: string;
  label: string;
};

function PlayerSelect({
  members,
  selectedPlayerIds,
  value,
  onChange,
  placeholder,
}: PlayerSelectProps) {
  const options = useMemo<PlayerOption[]>(
    () =>
      members.map((member) => ({
        value: member.id,
        label: getMemberDisplayName(member),
      })),
    [members],
  );

  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selectedOption}
      onValueChange={(nextOption) => {
        onChange(nextOption?.value ?? '');
      }}
      isItemEqualToValue={(item, selectedValue) => item.value === selectedValue.value}
      autoHighlight
      modal
    >
      <ComboboxInput
        aria-label={placeholder}
        placeholder={placeholder}
        showClear={Boolean(value)}
      />

      <ComboboxContent variant="custom" width="comfortable" align="center" alignOffset={12}>
        <ComboboxEmpty>Nenhum jogador encontrado.</ComboboxEmpty>

        <ComboboxList>
          {(option) => {
            const isSelected = option.value === value;
            const isSelectedElsewhere = selectedPlayerIds.includes(option.value) && !isSelected;

            return (
              <ComboboxItem
                key={option.value}
                value={option}
                disabled={isSelectedElsewhere}
                variant="custom"
              >
                <span className="truncate">{option.label}</span>

                {isSelectedElsewhere && (
                  <span className="ml-auto text-xs text-muted-foreground">Já selecionado</span>
                )}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

type ScoreInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const scoreOptions = ['0', '1', '2', '3', '4', '5', '6', '7'];

function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <ToggleGroup
      type="single"
      variant="default"
      value={value}
      onValueChange={(nextValue) => {
        if (!nextValue) return;

        onChange(nextValue);
      }}
      aria-label={`Placar ${label}`}
    >
      {scoreOptions.map((score) => (
        <ToggleGroupItem key={score} value={score} aria-label={`Time ${label}: ${score} games`}>
          {score}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function getWinner(gamesA: number, gamesB: number) {
  if (Number.isNaN(gamesA) || Number.isNaN(gamesB)) return null;
  if (gamesA === gamesB) return null;

  return gamesA > gamesB ? 'A' : 'B';
}

function getMemberDisplayName(member: GroupMember) {
  if (!member.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim();
}
