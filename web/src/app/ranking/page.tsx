import { getRanking } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';

export default async function RankingPage() {
	const ranking = await getRanking();

	return (
		<AppShell>
			<p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
				BeachRank
			</p>

			<h1 className="mt-3 text-3xl font-black">Ranking</h1>

			<p className="mt-2 text-sm text-muted-foreground">
				Rating casual baseado em desempenho nas partidas.
			</p>

			<section className="mt-8 space-y-3">
				{ranking.map((player, index) => (
					<Card key={player.id}>
						<CardContent className="flex items-center justify-between p-4">
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">
									#{index + 1}
								</div>

								<div>
									<p className="font-bold">{player.name}</p>
									<p className="text-sm text-muted-foreground">Jogador</p>
								</div>
							</div>

							<div className="text-right">
								<p className="text-xl font-black">{player.rating.toFixed(1)}</p>
								<p className="text-xs text-muted-foreground">rating</p>
							</div>
						</CardContent>
					</Card>
				))}
			</section>
		</AppShell>
	);
}