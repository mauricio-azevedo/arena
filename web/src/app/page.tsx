import { AppShell } from '@/components/app-shell';
import { AuthHeaderAction } from '@/features/auth/components/auth-header-action';
import { GroupHomeList } from '@/features/groups/components/group-home-list';
import { WeeklyHighlightsRail } from '@/features/weekly-highlights/components/weekly-highlights-rail';

export default function HomePage() {
  return (
    <AppShell
      chrome={{
        title: 'Seus grupos',
        trailing: <AuthHeaderAction redirectPath="/" />,
      }}
    >
      <WeeklyHighlightsRail />
      <GroupHomeList />
    </AppShell>
  );
}
