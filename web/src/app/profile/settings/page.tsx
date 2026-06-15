import { AppShell } from '@/components/app-shell';
import { ProfileSettings } from '@/features/profile/profile-settings';

export default function ProfileSettingsPage() {
  return (
    <AppShell chrome={{ title: 'Configurações', back: { fallbackHref: '/profile' } }}>
      <ProfileSettings />
    </AppShell>
  );
}
