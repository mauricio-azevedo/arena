import type {
  ProfileMatchListItemResponse,
  ProfileSummaryStats,
} from '@arena/contracts/profiles';

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
  matches: ProfileMatchListItemResponse[];
};
