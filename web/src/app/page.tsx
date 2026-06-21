import { AppShell } from '@/components/app-shell';
import { HomeHeader } from '@/features/home/components/home-header';
import { HomeScreen } from '@/features/home/components/home-screen';

export default function HomePage() {
  return (
    <AppShell chrome={{ bottomNav: true, header: <HomeHeader /> }}>
      <HomeScreen />
    </AppShell>
  );
}
