import type { Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
	matches: Match[];
};

export function MatchesList({ matches }: Props) {
	if (matches.length === 0) {
		return (
			<section className="mt-8">
				<h2 className="text-xl font-black">Histórico</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Nenhuma partida registrada ainda.
				</p>
			</section>
		);
	}

	return (
		<section className="mt-8">
			<div className="mt-4 space-y-3">
				{matches.map((match) => {
					const teamAWon = match.gamesA > match.gamesB;

					return (
						<Card key={match.id}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between gap-4">
									<div className="min-w-0 space-y-2">
										<TeamLine
											players={`${match.teamAPlayer1.name} / ${match.teamAPlayer2.name}`}
											isWinner={teamAWon}
										/>

										<TeamLine
											players={`${match.teamBPlayer1.name} / ${match.teamBPlayer2.name}`}
											isWinner={!teamAWon}
										/>

										<p className="pt-1 text-xs text-muted-foreground">
											{new Date(match.createdAt).toLocaleDateString('pt-BR')}
										</p>
									</div>

									<div className="shrink-0 text-right">
										<p className="text-2xl font-black">
											{match.gamesA}–{match.gamesB}
										</p>
										<p className="text-xs text-muted-foreground">
											{teamAWon
												? formatDelta(match.ratingDeltaA)
												: formatDelta(match.ratingDeltaB)}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</section>
	);
}

function TeamLine({
					  players,
					  isWinner,
				  }: {
	players: string;
	isWinner: boolean;
}) {
	return (
		<p
			className={`truncate text-sm ${
				isWinner ? 'font-bold text-foreground' : 'text-muted-foreground'
			}`}
		>
			{players}
		</p>
	);
}

function formatDelta(delta: number) {
	return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} rating`;
}