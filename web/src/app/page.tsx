import { AppShell } from '@/components/app-shell';
import { AuthHeaderAction } from '@/features/auth/components/auth-header-action';
import { GroupHomeList } from '@/features/groups/components/group-home-list';
import { TrendingPlayersRail } from '@/features/platform-trending/components/trending-players-rail';

export default function HomePage() {
  return (
    <AppShell
      chrome={{
        title: 'Seus grupos',
        trailing: <AuthHeaderAction redirectPath="/" />,
      }}
    >
      <TrendingPlayersRail />
      <GroupHomeList />
    </AppShell>
  );
}
