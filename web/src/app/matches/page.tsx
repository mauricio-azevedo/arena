import { getMatches, getRanking } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { MatchesList } from '@/components/matches-list';
import { PageHeader } from '@/components/page-header';

export default async function MatchesPage() {
  const [matches, players] = await Promise.all([getMatches(), getRanking()]);

  return (
    <AppShell>
      <PageHeader title="Partidas" />

      <MatchesList matches={matches} players={players} />
    </AppShell>
  );
}
