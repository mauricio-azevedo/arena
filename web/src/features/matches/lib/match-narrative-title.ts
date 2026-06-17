import type { Match, MatchTeam } from '@/types/api';

type MatchExpectation = 'FAVORITE_BIG_WIN' | 'FAVORITE_WIN';
type MatchResult = 'FAVORITE_BIG_WIN' | 'FAVORITE_WIN' | 'UNDERDOG_WIN' | 'UNDERDOG_BIG_WIN';

const NARRATIVE_TITLES: Record<MatchExpectation, Record<MatchResult, [string, string, string]>> = {
  FAVORITE_BIG_WIN: {
    FAVORITE_BIG_WIN: ['Sem dar chance', 'Domínio anunciado', 'Atropelo dentro do roteiro'],
    FAVORITE_WIN: [
      'Mais difícil que parecia',
      'Era para ser fácil, não foi',
      'Os azarões deram trabalho',
    ],
    UNDERDOG_WIN: ['Deu zebra', 'Ninguém viu essa vindo', 'Os azarões viraram o roteiro'],
    UNDERDOG_BIG_WIN: [
      'Inacreditável: os azarões atropelaram',
      'Atropelo contra todas as previsões',
      'Zebra com domínio total',
    ],
  },
  FAVORITE_WIN: {
    FAVORITE_BIG_WIN: [
      'Venceu com sobra',
      'Ganhou mais fácil que o esperado',
      'Transformou vantagem em atropelo',
    ],
    FAVORITE_WIN: ['Confirmou o favoritismo', 'Fez o esperado', 'Resultado dentro do esperado'],
    UNDERDOG_WIN: [
      'Contra o favoritismo',
      'Vitória contra a expectativa',
      'Resultado fora do roteiro',
    ],
    UNDERDOG_BIG_WIN: [
      'Atropelo inesperado',
      'Surpresa com autoridade',
      'Vitória improvável e dominante',
    ],
  },
};

export function getMatchNarrativeTitle(match: Match) {
  const favoriteTeam = getFavoriteTeam(match);

  if (!favoriteTeam) {
    return null;
  }

  const expectation = getMatchExpectation(match, favoriteTeam);
  const result = getMatchResult(match, favoriteTeam);
  const titles = NARRATIVE_TITLES[expectation][result];

  return titles[getWeightedTitleIndex(match.id)];
}

function getFavoriteTeam(match: Match): MatchTeam | null {
  if (match.teamAExpected === null || match.teamBExpected === null) {
    return null;
  }

  if (match.teamAExpected === match.teamBExpected) {
    return null;
  }

  return match.teamAExpected > match.teamBExpected ? 'TEAM_A' : 'TEAM_B';
}

function getMatchExpectation(match: Match, favoriteTeam: MatchTeam): MatchExpectation {
  const favoriteExpected = favoriteTeam === 'TEAM_A' ? match.teamAExpected : match.teamBExpected;

  return favoriteExpected !== null && favoriteExpected >= 0.75
    ? 'FAVORITE_BIG_WIN'
    : 'FAVORITE_WIN';
}

function getMatchResult(match: Match, favoriteTeam: MatchTeam): MatchResult {
  const favoriteGames = favoriteTeam === 'TEAM_A' ? match.gamesA : match.gamesB;
  const totalGames = match.gamesA + match.gamesB;
  const favoriteShare = totalGames > 0 ? favoriteGames / totalGames : 0;

  if (favoriteShare >= 0.75) {
    return 'FAVORITE_BIG_WIN';
  }

  if (favoriteShare >= 0.5) {
    return 'FAVORITE_WIN';
  }

  if (favoriteShare >= 0.25) {
    return 'UNDERDOG_WIN';
  }

  return 'UNDERDOG_BIG_WIN';
}

function getWeightedTitleIndex(matchId: string) {
  const bucket = hashString(matchId) % 10;

  if (bucket < 7) {
    return 0;
  }

  if (bucket < 9) {
    return 1;
  }

  return 2;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}
