import { AppShell } from '@/components/app-shell';
import { AuthHeaderAction } from '@/features/auth/components/auth-header-action';
import { GroupHomeList } from '@/features/groups/components/group-home-list';

export default function HomePage() {
  return (
    <AppShell
      chrome={{
        title: 'Seus grupos',
        trailing: <AuthHeaderAction redirectPath="/" />,
      }}
    >
      <GroupHomeList />
    </AppShell>
  );
}
