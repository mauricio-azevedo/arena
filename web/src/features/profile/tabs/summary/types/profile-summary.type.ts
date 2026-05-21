import type { ProfileSummaryGroup } from './profile-summary-group.type';
import type { ProfileSummaryMatch } from './profile-summary-match.type';
import type { ProfileSummaryStats } from './profile-summary-stats.type';
import type { ProfileUser } from '../../../types/profile-user.type';

export type ProfileSummary = {
  user: ProfileUser;
  stats: ProfileSummaryStats;
  recentMatches: ProfileSummaryMatch[];
  recentGroups: ProfileSummaryGroup[];
};
