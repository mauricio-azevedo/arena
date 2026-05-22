export type DominantWinFeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export type DominantWinFeedMetadata = {
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: DominantWinFeedPlayer[];
  losers: DominantWinFeedPlayer[];
};
