import { getRanking } from '@/lib/api';
import { AddPlayerForm } from '@/components/add-player-form';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';

export default async function PlayersPage() {
  const players = await getRanking();

  return (
    <AppShell>
      <PageHeader title="Jogadores" />
      <AddPlayerForm />

      <section className="mt-8 space-y-3">
        {players.map((player) => (
          <div key={player.id} className="rounded-2xl border p-4">
            <p className="font-bold">{player.name}</p>
            <p className="text-sm text-muted-foreground">{player.rating.toFixed(1)} rating</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
