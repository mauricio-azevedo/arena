import type { Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
	matches: Match[];
};

export function MatchesList({ matches }: Props) {
	if (matches.length === 0) {
		return (
			<section className="mt-8">
				<p className="text-sm text-muted-foreground">
					Nenhuma partida registrada ainda.
				</p>
			</section>
		);
	}

	return (
		<section className="mt-8 space-y-3">
			{matches.map((match) => {
				const teamAWon = match.gamesA > match.gamesB;
				const winningDelta = teamAWon ? match.ratingDeltaA : match.ratingDeltaB;

				return (
					<Card key={match.id} className="overflow-hidden">
						<CardContent className="p-4">
							<div className="flex items-center justify-between gap-4">
								<div className="min-w-0 flex-1 space-y-3">
									<MatchTeam
										names={`${match.teamAPlayer1.name} / ${match.teamAPlayer2.name}`}
										score={match.gamesA}
										isWinner={teamAWon}
									/>

									<MatchTeam
										names={`${match.teamBPlayer1.name} / ${match.teamBPlayer2.name}`}
										score={match.gamesB}
										isWinner={!teamAWon}
									/>

									<p className="text-xs text-muted-foreground">
										{formatDate(match.createdAt)}
									</p>
								</div>

								<div className="shrink-0 text-right">
									<p className="text-3xl font-semibold tracking-tight">
										{match.gamesA}–{match.gamesB}
									</p>

									<p className="mt-1 text-xs text-muted-foreground">
										{formatDelta(winningDelta)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</section>
	);
}

type MatchTeamProps = {
	names: string;
	score: number;
	isWinner: boolean;
};

function MatchTeam({ names, score, isWinner }: MatchTeamProps) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<div
				className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
					isWinner
						? 'bg-foreground text-background'
						: 'bg-muted text-muted-foreground'
				}`}
			>
				{score}
			</div>

			<p
				className={`truncate text-sm ${
					isWinner
						? 'font-semibold text-foreground'
						: 'text-muted-foreground'
				}`}
			>
				{names}
			</p>
		</div>
	);
}

function formatDelta(delta: number) {
	return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'short',
	});
}