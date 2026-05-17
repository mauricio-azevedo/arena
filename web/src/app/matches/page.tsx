import { getMatches, getRanking } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { MatchesList } from '@/components/matches-list';

export default async function MatchesPage() {
	const [matches, players] = await Promise.all([getMatches(), getRanking()]);

	return (
		<AppShell>
			<header>
				<h1 className="text-3xl font-semibold tracking-tight">Histórico</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Corrija lançamentos quando necessário.
				</p>
			</header>

			<MatchesList matches={matches} players={players} />
		</AppShell>
	);
}