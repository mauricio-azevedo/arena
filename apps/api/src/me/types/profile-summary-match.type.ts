import type { MatchTeam } from '../../generated/prisma/enums';
import type { ProfileSummaryMatchResult } from './profile-summary-match-result.type';

export type ProfileMatchPlayer = {
  // Null for stub players (jogadores sem conta) — no linkable profile.
  userId: string | null;
  displayName: string;
};

export type ProfileSummaryMatch = {
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
};
