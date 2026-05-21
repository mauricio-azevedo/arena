import { ProfileSummaryStatsGrid } from '@/features/profile/components/profile-summary-stats-grid';
import { ProfileSummary } from '@/features/profile/types/profile-summary.type';
import { RecentGroupsSection } from '@/features/profile/sections/recent-groups-section';
import { RecentMatchesSection } from '@/features/profile/sections/recent-matches-section';

type Props = {
  summary: ProfileSummary;
  onViewAllMatches: () => void;
  onViewAllGroups: () => void;
};

export function ProfileSummaryTab({ summary, onViewAllMatches, onViewAllGroups }: Props) {
  return (
    <div className="space-y-4">
      <ProfileSummaryStatsGrid stats={summary.stats} />
      <RecentMatchesSection matches={summary.recentMatches} onViewAll={onViewAllMatches} />
      <RecentGroupsSection groups={summary.recentGroups} onViewAll={onViewAllGroups} />
    </div>
  );
}
