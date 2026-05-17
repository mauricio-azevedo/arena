import { getMatches, getRanking } from '@/lib/api';
import { AddPlayerForm } from '@/components/add-player-form';
import { AddMatchForm } from '@/components/add-match-form';
import { MatchesList } from '@/components/matches-list';

export default async function Home() {
	const [ranking, matches] = await Promise.all([getRanking(), getMatches()]);

	return (
		<main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
			<div className="mx-auto max-w-md">
				<p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
					BeachRank
				</p>

				<h1 className="mt-3 text-3xl font-black">Ranking</h1>

				<p className="mt-2 text-sm text-zinc-400">
					Rating casual baseado em desempenho nas partidas.
				</p>

				<AddPlayerForm />

				<AddMatchForm players={ranking} />

				<section className="mt-8 space-y-3">
					{ranking.map((player, index) => (
						<div
							key={player.id}
							className="flex items-center justify-between rounded-2xl bg-zinc-900 p-4"
						>
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 font-black text-zinc-950">
									#{index + 1}
								</div>

								<div>
									<p className="font-bold">{player.name}</p>
									<p className="text-sm text-zinc-500">Jogador</p>
								</div>
							</div>

							<div className="text-right">
								<p className="text-xl font-black">
									{player.rating.toFixed(1)}
								</p>
								<p className="text-xs text-zinc-500">rating</p>
							</div>
						</div>
					))}
				</section>

				<MatchesList matches={matches} />
			</div>
		</main>
	);
}