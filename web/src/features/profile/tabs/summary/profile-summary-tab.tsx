import { ProfileSummary } from '@/features/profile/tabs/summary/types/profile-summary.type';
import { RecentGroupsSection } from '@/features/profile/tabs/summary/sections/recent-groups-section';
import { RecentMatchesSection } from '@/features/profile/tabs/summary/sections/recent-matches-section';

type Props = {
  summary: ProfileSummary;
  onViewAllMatches: () => void;
  onViewAllGroups: () => void;
};

export function ProfileSummaryTab({ summary, onViewAllMatches, onViewAllGroups }: Props) {
  return (
    <div className="space-y-4">
      <RecentMatchesSection matches={summary.recentMatches} onViewAll={onViewAllMatches} />
      <RecentGroupsSection groups={summary.recentGroups} onViewAll={onViewAllGroups} />
    </div>
  );
}
