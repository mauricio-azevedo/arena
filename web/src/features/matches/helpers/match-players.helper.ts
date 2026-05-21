import type { Match, MatchPlayer } from '@/types/api';

export function getMatchTeamPlayers(match: Match, team: 'TEAM_A' | 'TEAM_B') {
  return match.players
    .filter((player) => player.team === team)
    .sort((a, b) => a.position - b.position);
}

export function getAverageRatingDelta(players: MatchPlayer[]) {
  if (players.length === 0) {
    return 0;
  }

  const total = players.reduce((sum, player) => sum + player.ratingDelta, 0);

  return total / players.length;
}
