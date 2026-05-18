import { getRanking } from '@/lib/api';
import { AddPlayerForm } from '@/components/add-player-form';
import { AppShell } from '@/components/app-shell';

export default async function PlayersPage() {
  const players = await getRanking();

  return (
    <AppShell>
      <h1 className="text-3xl font-black">Jogadores</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Cadastre jogadores para registrar partidas.
      </p>

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
