import type { ProfileSummaryGroup } from './profile-summary-group.type';
import type { ProfileSummaryMatch } from './profile-summary-match.type';
import type { ProfileSummaryStats } from './profile-summary-stats.type';
import type { ProfileSummaryUser } from './profile-summary-user.type';

export type ProfileSummary = {
  user: ProfileSummaryUser;
  stats: ProfileSummaryStats;
  recentMatches: ProfileSummaryMatch[];
  recentGroups: ProfileSummaryGroup[];
};
