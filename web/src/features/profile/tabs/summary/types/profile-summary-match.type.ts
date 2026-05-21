import type { ProfileMatchResult } from '../../../enums/profile-match-result.enum';

export type ProfileMatchPlayer = {
  userId: string;
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
