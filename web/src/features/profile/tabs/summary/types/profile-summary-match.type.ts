import type { ProfileMatchResult } from '../../../enums/profile-match-result.enum';

export type ProfileMatchPlayer = {
  // Null for stub players (jogadores sem conta) — no linkable profile.
  userId: string | null;
  displayName: string;
};

export type ProfileSummaryMatch = {
  id: string;
  groupId: string;
  groupName: string;
  playedAt: string;
  gamesA: number;
  gamesB: number;
  winnerTeam: 'TEAM_A' | 'TEAM_B' | null;
  result: ProfileMatchResult;
  teamA: ProfileMatchPlayer[];
  teamB: ProfileMatchPlayer[];
};
