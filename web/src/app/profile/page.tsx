import { AppShell } from '@/components/app-shell';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function ProfilePage() {
  return (
    <AppShell chrome={{ topBar: false }}>
      <ProfileScreen />
    </AppShell>
  );
}
