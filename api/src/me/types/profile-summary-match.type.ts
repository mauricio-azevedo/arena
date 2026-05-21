import type { MatchTeam } from '../../generated/prisma/enums';
import type { ProfileSummaryMatchResult } from './profile-summary-match-result.type';

export type ProfileSummaryMatch = {
  id: string;
  groupId: string;
  groupName: string;
  playedAt: Date;
  gamesA: number;
  gamesB: number;
  winnerTeam: MatchTeam | null;
  result: ProfileSummaryMatchResult;
  teamA: string[];
  teamB: string[];
};
