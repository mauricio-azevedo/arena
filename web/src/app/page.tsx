import { AppShell } from '@/components/app-shell';
import { HomeFeed } from '@/features/feed/home-feed';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">BeachRank</h1>
        </header>

        <HomeFeed />
      </div>
    </AppShell>
  );
}
