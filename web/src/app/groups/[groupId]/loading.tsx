import { AppShell } from '@/components/app-shell';
import { GroupDetailLoadingState } from '@/features/groups/components/group-detail-loading-state';

export default function GroupDetailLoading() {
  return (
    <AppShell>
      <GroupDetailLoadingState />
    </AppShell>
  );
}
