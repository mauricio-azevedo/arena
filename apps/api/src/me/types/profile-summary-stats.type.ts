import type { ProfileSummaryMatchResult } from './profile-summary-match-result.type';

export type ProfileSummaryStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  // Results of the player's most recent matches, most recent first ("forma recente").
  recentForm: ProfileSummaryMatchResult[];
};
