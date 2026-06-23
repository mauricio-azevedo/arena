import { AppShell } from '@/components/app-shell';
import { ProfileLoadingState } from '@/features/profile/components/profile-loading-state';

export default function ProfileLoading() {
  return (
    <AppShell chrome={{ topBar: false }}>
      <ProfileLoadingState />
    </AppShell>
  );
}
