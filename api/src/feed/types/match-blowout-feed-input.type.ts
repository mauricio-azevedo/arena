import type { MatchTeam } from '../../generated/prisma/enums';

export type MatchBlowoutFeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export type MatchBlowoutFeedInput = {
  groupId: string;
  matchId: string;
  winnerTeam: MatchTeam;
  gamesA: number;
  gamesB: number;
  winners: MatchBlowoutFeedPlayer[];
  losers: MatchBlowoutFeedPlayer[];
  occurredAt: Date;
};
