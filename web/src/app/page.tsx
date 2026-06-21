import { AppShell } from '@/components/app-shell';
import { HomeScreen } from '@/features/home/components/home-screen';

export default function HomePage() {
  return (
    <AppShell chrome={{ topBar: false, bottomNav: true }}>
      <HomeScreen />
    </AppShell>
  );
}
