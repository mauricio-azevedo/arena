export type RankingMovementFeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export type RankingMovementFeedAffectedMember = RankingMovementFeedPlayer & {
  rank: number | null;
};

export type RankingMovementFeedMovement = RankingMovementFeedPlayer & {
  direction: 'UP' | 'DOWN';
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  affectedMembers: RankingMovementFeedAffectedMember[];
};

export type RankingMovementFeedMetadata = {
  headline: string;
  headlineVariant:
    | 'LEADERSHIP_CHANGED'
    | 'SINGLE_UP'
    | 'DOUBLE_UP'
    | 'SINGLE_DOWN'
    | 'DOUBLE_DOWN'
    | 'MIXED'
    | 'RANKING_TURNED_UPSIDE_DOWN';
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: RankingMovementFeedPlayer[];
  losers: RankingMovementFeedPlayer[];
  movements: RankingMovementFeedMovement[];
  leadershipChange: {
    previousLeaders: RankingMovementFeedPlayer[];
    currentLeaders: RankingMovementFeedPlayer[];
    dethronedLeaders: RankingMovementFeedPlayer[];
  } | null;
};
