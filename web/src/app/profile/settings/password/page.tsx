import { AppShell } from '@/components/app-shell';
import { ProfilePasswordSettings } from '@/features/profile/profile-password-settings';

export default function ProfilePasswordSettingsPage() {
  return (
    <AppShell chrome={{ title: 'Alterar senha', back: { fallbackHref: '/profile/settings' } }}>
      <ProfilePasswordSettings />
    </AppShell>
  );
}
