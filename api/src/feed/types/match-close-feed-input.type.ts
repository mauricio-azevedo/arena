import type { MatchTeam } from '../../generated/prisma/enums';
import type { FeedPlayer } from './feed-player.type';

export type MatchCloseFeedPlayer = FeedPlayer;

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
