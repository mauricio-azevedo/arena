import { AppShell } from '@/components/app-shell';
import { ProfileEditSettings } from '@/features/profile/profile-edit-settings';

export default function ProfileEditSettingsPage() {
  return (
    <AppShell chrome={{ title: 'Alterar perfil', back: { fallbackHref: '/profile/settings' } }}>
      <ProfileEditSettings />
    </AppShell>
  );
}
