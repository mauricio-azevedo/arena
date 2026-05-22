import { AppShell } from '@/components/app-shell';
import { ProfileLoadingState } from '@/features/profile/components/profile-loading-state';

export default function UserProfileLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
        <ProfileLoadingState />
      </div>
    </AppShell>
  );
}
