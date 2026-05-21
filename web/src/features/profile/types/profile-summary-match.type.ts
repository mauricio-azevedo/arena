import type { ProfileSummaryMatchResult } from './profile-summary-match-result.type';

export type ProfileSummaryMatch = {
  id: string;
  groupId: string;
  groupName: string;
  playedAt: string;
  gamesA: number;
  gamesB: number;
  winnerTeam: 'TEAM_A' | 'TEAM_B' | null;
  result: ProfileSummaryMatchResult;
  teamA: string[];
  teamB: string[];
};
