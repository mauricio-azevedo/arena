export type ProfileSummaryStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  // Most recent results first ("forma recente").
  recentForm: ('WIN' | 'LOSS')[];
};
