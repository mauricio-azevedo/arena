import { AppShell } from '@/components/app-shell';
import { ProfileLoadingState } from '@/features/profile/components/profile-loading-state';

export default function UserProfileLoading() {
  return (
    <AppShell chrome={{ title: 'Perfil', back: { fallbackHref: '/' } }}>
      <ProfileLoadingState />
    </AppShell>
  );
}
