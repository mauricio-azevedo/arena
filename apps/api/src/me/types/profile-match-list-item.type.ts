import type { MatchTeam } from '../../generated/prisma/enums';
import type { ProfileSummaryMatchResult } from './profile-summary-match-result.type';
import type { ProfileMatchPlayer } from './profile-summary-match.type';

export type ProfileMatchListItem = {
  id: string;
  groupId: string;
  groupName: string;
  playedAt: Date;

  gamesA: number;
  gamesB: number;
  winnerTeam: MatchTeam | null;
  result: ProfileSummaryMatchResult;

  teamA: ProfileMatchPlayer[];
  teamB: ProfileMatchPlayer[];

  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
};
