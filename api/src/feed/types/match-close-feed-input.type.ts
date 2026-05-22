import type { MatchTeam } from '../../generated/prisma/enums';

export type MatchCloseFeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export type MatchCloseFeedInput = {
  groupId: string;
  matchId: string;
  winnerTeam: MatchTeam;
  gamesA: number;
  gamesB: number;
  winners: MatchCloseFeedPlayer[];
  losers: MatchCloseFeedPlayer[];
  occurredAt: Date;
};
