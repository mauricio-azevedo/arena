import type { ProfileMatchListItem } from '@/features/profile/types/profile-match-list-item.type';

export type MemberProfileStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
};

// Group-scoped profile for a single member (real or stub). Mirrors the API
// GET /groups/:groupId/members/:memberId/profile.
export type MemberProfile = {
  groupMemberId: string;
  groupId: string;
  userId: string | null;
  displayName: string;
  rating: number;
  currentRank: number | null;
  stats: MemberProfileStats;
  matches: ProfileMatchListItem[];
};
