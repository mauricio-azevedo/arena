import { AppShell } from '@/components/app-shell';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileLoadingState } from '@/features/profile/components/profile-loading-state';

export default function ProfileLoading() {
  // Same header shell as the loaded screen (the gear appears once it's interactive)
  // so the top rhythm matches and the swap stays calm.
  return (
    <AppShell chrome={{ bottomNav: true, header: <ProfileHeader /> }}>
      <ProfileLoadingState />
    </AppShell>
  );
}
