import { AppShell } from '@/components/app-shell';
import { GroupHomeList } from '@/features/groups/components/group-home-list';

export default function HomePage() {
  return (
    <AppShell chrome={{ title: 'Seus grupos' }}>
      <GroupHomeList />
    </AppShell>
  );
}
