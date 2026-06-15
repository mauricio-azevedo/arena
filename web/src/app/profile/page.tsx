import { AppShell } from '@/components/app-shell';
import { Profile } from '@/features/profile/profile';

export default function ProfilePage() {
  return (
    <AppShell chrome={{ title: 'Perfil' }}>
      <Profile />
    </AppShell>
  );
}
