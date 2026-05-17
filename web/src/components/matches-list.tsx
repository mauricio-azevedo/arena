import type { Match } from '@/types/api';

type Props = {
	matches: Match[];
};

export function MatchesList({ matches }: Props) {
	return (
		<section className="mt-8">
			<h2 className="text-xl font-black">Histórico</h2>

			<div className="mt-4 space-y-3">
				{matches.map((match) => (
					<div key={match.id} className="rounded-2xl bg-zinc-900 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-bold">
									{match.teamAPlayer1.name} / {match.teamAPlayer2.name}
								</p>
								<p className="mt-1 text-sm text-zinc-500">
									vs {match.teamBPlayer1.name} / {match.teamBPlayer2.name}
								</p>
							</div>

							<div className="text-right">
								<p className="text-xl font-black">
									{match.gamesA}–{match.gamesB}
								</p>
								<p className="text-xs text-zinc-500">placar</p>
							</div>
						</div>

						<div className="mt-3 flex justify-between text-xs text-zinc-500">
							<span>
								Delta A: {match.ratingDeltaA >= 0 ? '+' : ''}
								{match.ratingDeltaA.toFixed(2)}
							</span>

							<span>
								{new Date(match.createdAt).toLocaleDateString('pt-BR')}
							</span>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}