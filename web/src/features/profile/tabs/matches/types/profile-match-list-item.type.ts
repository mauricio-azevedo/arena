import { ProfileMatchResult } from '@/features/profile/enums/profile-match-result.enum';

export type ProfileMatchListItem = {
  id: string;
  groupId: string;
  groupName: string;
  playedAt: string;

  gamesA: number;
  gamesB: number;
  winnerTeam: 'TEAM_A' | 'TEAM_B' | null;
  result: ProfileMatchResult;

  teamA: string[];
  teamB: string[];

  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
};
