export type CloseMatchFeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export type CloseMatchFeedMetadata = {
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  gamesA: number;
  gamesB: number;
  winners: CloseMatchFeedPlayer[];
  losers: CloseMatchFeedPlayer[];
};
