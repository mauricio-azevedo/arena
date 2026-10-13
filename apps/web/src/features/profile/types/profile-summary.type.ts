import type { ProfileSummaryGroup } from './profile-summary-group.type';
import type { ProfileSummaryMatch } from './profile-summary-match.type';
import type { ProfileSummaryPartner } from './profile-summary-partner.type';
import type { ProfileSummaryStats } from './profile-summary-stats.type';
import type { ProfileUser } from './profile-user.type';

export type ProfileSummary = {
  user: ProfileUser;
  stats: ProfileSummaryStats;
  // Your most successful partnership ("melhor dupla"); null with no eligible partner.
  bestPartner: ProfileSummaryPartner | null;
  // All partnerships, strongest first ("suas duplas").
  partners: ProfileSummaryPartner[];
  partnerCount: number;
  recentMatches: ProfileSummaryMatch[];
  // The player's groups, most recently played first.
  recentGroups: ProfileSummaryGroup[];
};
