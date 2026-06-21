import { useMemo, useState } from 'react';
import type { Match } from '@/types/api';

export type SlotKey = 'a1' | 'a2' | 'b1' | 'b2';
export type Slots = Record<SlotKey, string | null>;

export const SLOT_KEYS: SlotKey[] = ['a1', 'a2', 'b1', 'b2'];

export const SLOT_SUBLABELS: Record<SlotKey, string> = {
  a1: 'Dupla A · 1º jogador',
  a2: 'Dupla A · 2º jogador',
  b1: 'Dupla B · 1º jogador',
  b2: 'Dupla B · 2º jogador',
};

const MIN_GAMES = 0;
const MAX_GAMES = 7;

function initSlots(match?: Match): Slots {
  const memberAt = (team: 'TEAM_A' | 'TEAM_B', position: number) =>
    match?.players.find((player) => player.team === team && player.position === position)
      ?.groupMemberId ?? null;

  return {
    a1: memberAt('TEAM_A', 1),
    a2: memberAt('TEAM_A', 2),
    b1: memberAt('TEAM_B', 1),
    b2: memberAt('TEAM_B', 2),
  };
}

function clampGames(value: number) {
  return Math.min(MAX_GAMES, Math.max(MIN_GAMES, value));
}

// Beach-tennis single set: the winner closes at 6 (loser ≤4), 7–5, or 7–6
// (6–6 tie-break). Mirrors the approved prototype's rules.
function isValidScore(a: number, b: number) {
  if (a === b) {
    return false;
  }

  const hi = Math.max(a, b);
  const lo = Math.min(a, b);

  return (hi === 6 && lo <= 4) || (hi === 7 && (lo === 5 || lo === 6));
}

const DEFAULT_HELPER =
  '1 set até 6 games. Em 5–5 vai até 7; 6–6 é tie-break, registrado como 7–6.';

export function useMatchForm(match?: Match) {
  const [slots, setSlots] = useState<Slots>(() => initSlots(match));
  const [scoreA, setScoreA] = useState(() => (match ? match.gamesA : 0));
  const [scoreB, setScoreB] = useState(() => (match ? match.gamesB : 0));

  const assign = (slot: SlotKey, memberId: string) =>
    setSlots((current) => ({ ...current, [slot]: memberId }));

  const clear = (slot: SlotKey) => setSlots((current) => ({ ...current, [slot]: null }));

  const stepA = (delta: number) => setScoreA((value) => clampGames(value + delta));
  const stepB = (delta: number) => setScoreB((value) => clampGames(value + delta));

  const selectedIds = useMemo(
    () => SLOT_KEYS.map((key) => slots[key]).filter((id): id is string => Boolean(id)),
    [slots],
  );

  const allChosen = selectedIds.length === 4 && new Set(selectedIds).size === 4;

  const validScore = useMemo(() => isValidScore(scoreA, scoreB), [scoreA, scoreB]);

  // A team is the winner only with a valid winning scoreline — used for the
  // "Venceu" badge, the card tint and the score colour.
  const winner: 'A' | 'B' | null = !validScore ? null : scoreA > scoreB ? 'A' : 'B';

  const canSave = allChosen && validScore;

  const { helperText, helperWarn } = useMemo(() => {
    if (scoreA === 6 && scoreB === 6) {
      return {
        helperText: 'Tie-break em 6–6 — leve o vencedor a 7 (fica 7–6).',
        helperWarn: true,
      };
    }

    if ((scoreA > 0 || scoreB > 0) && !isValidScore(scoreA, scoreB)) {
      return {
        helperText: 'Placar incompleto: o vencedor fecha em 6, 7–5 ou 7–6.',
        helperWarn: true,
      };
    }

    return { helperText: DEFAULT_HELPER, helperWarn: false };
  }, [scoreA, scoreB]);

  return {
    slots,
    scoreA,
    scoreB,
    assign,
    clear,
    stepA,
    stepB,
    selectedIds,
    allChosen,
    validScore,
    winner,
    canSave,
    helperText,
    helperWarn,
    minGames: MIN_GAMES,
    maxGames: MAX_GAMES,
  };
}

export type MatchFormState = ReturnType<typeof useMatchForm>;
