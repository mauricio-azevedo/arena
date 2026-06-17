export type PlatformTrendingPlayer = {
  userId: string;
  displayName: string;
  trendRank: number;
  score: number;
  recentMatches: number;
  recentWins: number;
  recentWinRate: number;
  allTimeMatches: number;
  allTimeWins: number;
  allTimeWinRate: number;
  windowDays: number;
  windowStartedAt: string;
  windowEndedAt: string;
  computedAt: string;
  highlightGroup: {
    id: string;
    name: string;
  } | null;
  highlightGroupMember: {
    id: string;
    groupId: string;
    currentRank: number | null;
    rating: number;
  } | null;
};
