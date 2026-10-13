import type { ProfileMatchListItem } from '../../me/types/profile-match-list-item.type';
import type { ProfileSummaryStats } from '../../me/types/profile-summary-stats.type';

// Group-scoped profile for a single member (real or stub). Unlike the userId-based
// /users profile (cross-group), this is everything about one membership inside one
// group — the only profile a stub player can have.
export type MemberProfile = {
  groupMemberId: string;
  groupId: string;
  userId: string | null;
  displayName: string;
  avatarColor: string | null;
  rating: number;
  currentRank: number | null;
  stats: ProfileSummaryStats;
  matches: ProfileMatchListItem[];
};
