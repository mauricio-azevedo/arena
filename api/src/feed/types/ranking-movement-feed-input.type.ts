import type { MatchTeam } from '../../generated/prisma/enums';

export type RankingMovementFeedDirection = 'UP' | 'DOWN';

export type RankingMovementFeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export type RankingMovementFeedAffectedMember = RankingMovementFeedPlayer & {
  rank: number | null;
};

export type RankingMovementFeedMovement = RankingMovementFeedPlayer & {
  direction: RankingMovementFeedDirection;
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  affectedMembers: RankingMovementFeedAffectedMember[];
};

export type RankingMovementFeedLeadershipChange = {
  previousLeaders: RankingMovementFeedPlayer[];
  currentLeaders: RankingMovementFeedPlayer[];
  dethronedLeaders: RankingMovementFeedPlayer[];
};

export type RankingMovementFeedHeadlineVariant =
  | 'LEADERSHIP_CHANGED'
  | 'SINGLE_UP'
  | 'DOUBLE_UP'
  | 'SINGLE_DOWN'
  | 'DOUBLE_DOWN'
  | 'MIXED'
  | 'RANKING_TURNED_UPSIDE_DOWN';

export type RankingMovementFeedInput = {
  groupId: string;
  matchId: string;
  winnerTeam: MatchTeam;
  gamesA: number;
  gamesB: number;
  winners: RankingMovementFeedPlayer[];
  losers: RankingMovementFeedPlayer[];
  movements: RankingMovementFeedMovement[];
  leadershipChange?: RankingMovementFeedLeadershipChange | null;
  occurredAt: Date;
};
