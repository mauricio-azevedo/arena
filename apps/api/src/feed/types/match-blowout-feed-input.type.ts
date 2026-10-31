import type { MatchTeam } from '../../generated/prisma/enums';
import type { FeedPlayer } from './feed-player.type';

type MatchBlowoutFeedPlayer = FeedPlayer;

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
