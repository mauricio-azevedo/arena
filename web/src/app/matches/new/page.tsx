import { getRanking } from '@/lib/api';
import { AddMatchForm } from '@/components/add-match-form';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';

export default async function NewMatchPage() {
  const players = await getRanking();

  return (
    <AppShell>
      <PageHeader title="Registar Partida" />

      <AddMatchForm players={players} />
    </AppShell>
  );
}
