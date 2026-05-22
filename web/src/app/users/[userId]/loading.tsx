import { AppShell } from '@/components/app-shell';
import { ProfileLoadingState } from '@/features/profile/components/profile-loading-state';

export default function UserProfileLoading() {
  return (
    <AppShell>
      <ProfileLoadingState />
    </AppShell>
  );
}
