import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { ProfileLoadingState } from '@/features/profile/components/profile-loading-state';

export default function UserProfileLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <BackButton href="/groups" />
        <ProfileLoadingState />
      </div>
    </AppShell>
  );
}
