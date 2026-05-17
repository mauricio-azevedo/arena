import { getMatches, getRanking } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { MatchesList } from '@/components/matches-list';

export default async function MatchesPage() {
	const matches = await getMatches();

	return (
		<AppShell>
			<h1 className="text-3xl font-black">Histórico</h1>

			<p className="mt-2 text-sm text-muted-foreground">
				Veja e corrija partidas registradas.
			</p>

			<MatchesList matches={matches} />
		</AppShell>
	);
}