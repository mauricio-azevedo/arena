import type { ProfileMatchResult } from '../../../enums/profile-match-result.enum';
import type { ProfileMatchPlayer } from '../../summary/types/profile-summary-match.type';

export type ProfileMatchListItem = {
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

  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
};
