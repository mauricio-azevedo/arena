import { getRanking } from '@/lib/api';
import { AddMatchForm } from '@/components/add-match-form';
import { AppShell } from '@/components/app-shell';

export default async function NewMatchPage() {
  const players = await getRanking();

  return (
    <AppShell>
      <h1 className="text-3xl font-black">Nova partida</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Registre o placar para atualizar o ranking.
      </p>

      <AddMatchForm players={players} />
    </AppShell>
  );
}
