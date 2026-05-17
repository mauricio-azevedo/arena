'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/api';
import type { Player } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

type Props = {
	players: Player[];
};

export function AddMatchForm({ players }: Props) {
	const router = useRouter();

	const [teamAPlayer1Id, setTeamAPlayer1Id] = useState('');
	const [teamAPlayer2Id, setTeamAPlayer2Id] = useState('');
	const [teamBPlayer1Id, setTeamBPlayer1Id] = useState('');
	const [teamBPlayer2Id, setTeamBPlayer2Id] = useState('');
	const [gamesA, setGamesA] = useState('6');
	const [gamesB, setGamesB] = useState('4');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const selectedPlayerIds = useMemo(
		() => [
			teamAPlayer1Id,
			teamAPlayer2Id,
			teamBPlayer1Id,
			teamBPlayer2Id,
		].filter(Boolean),
		[teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id],
	);

	const winnerLabel = getWinnerLabel(Number(gamesA), Number(gamesB));

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError('');
		setSuccessMessage('');

		const playerIds = [
			teamAPlayer1Id,
			teamAPlayer2Id,
			teamBPlayer1Id,
			teamBPlayer2Id,
		];

		if (playerIds.some((id) => !id)) {
			setError('Selecione os quatro jogadores.');
			return;
		}

		if (new Set(playerIds).size !== 4) {
			setError('O mesmo jogador não pode aparecer duas vezes na partida.');
			return;
		}

		const parsedGamesA = Number(gamesA);
		const parsedGamesB = Number(gamesB);

		if (
			Number.isNaN(parsedGamesA) ||
			Number.isNaN(parsedGamesB) ||
			parsedGamesA < 0 ||
			parsedGamesB < 0
		) {
			setError('Informe um placar válido.');
			return;
		}

		if (parsedGamesA === parsedGamesB) {
			setError('A partida precisa ter vencedor. Se foi tiebreak, registre como 7–6.');
			return;
		}

		setIsSubmitting(true);

		try {
			await createMatch({
				teamAPlayer1Id,
				teamAPlayer2Id,
				teamBPlayer1Id,
				teamBPlayer2Id,
				gamesA: parsedGamesA,
				gamesB: parsedGamesB,
			});

			setSuccessMessage('Partida registrada. O ranking foi atualizado.');
			setTeamAPlayer1Id('');
			setTeamAPlayer2Id('');
			setTeamBPlayer1Id('');
			setTeamBPlayer2Id('');
			setGamesA('6');
			setGamesB('4');

			router.refresh();
		} catch {
			setError('Não foi possível registrar a partida. Tente novamente.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card className="mt-6">
			<CardHeader>
				<CardTitle>Registrar partida</CardTitle>
				<p className="text-sm text-muted-foreground">
					Registre o resultado depois do jogo. O rating será recalculado automaticamente.
				</p>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<section className="space-y-3 rounded-2xl border p-3">
						<div className="flex items-center justify-between">
							<p className="font-bold">Dupla A</p>
							{winnerLabel === 'A' && (
								<span className="rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
									vencedora
								</span>
							)}
						</div>

						<div className="grid grid-cols-2 gap-1">
							<PlayerSelect
								label="Jogador 1"
								value={teamAPlayer1Id}
								onChange={setTeamAPlayer1Id}
								players={players}
								selectedPlayerIds={selectedPlayerIds}
							/>

							<PlayerSelect
								label="Jogador 2"
								value={teamAPlayer2Id}
								onChange={setTeamAPlayer2Id}
								players={players}
								selectedPlayerIds={selectedPlayerIds}
							/>
						</div>
					</section>

					<section className="space-y-3 rounded-2xl border p-3">
						<div className="flex items-center justify-between">
							<p className="font-bold">Dupla B</p>
							{winnerLabel === 'B' && (
								<span className="rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
									vencedora
								</span>
							)}
						</div>

						<div className="grid grid-cols-2 gap-1">
							<PlayerSelect
								label="Jogador 1"
								value={teamBPlayer1Id}
								onChange={setTeamBPlayer1Id}
								players={players}
								selectedPlayerIds={selectedPlayerIds}
							/>

							<PlayerSelect
								label="Jogador 2"
								value={teamBPlayer2Id}
								onChange={setTeamBPlayer2Id}
								players={players}
								selectedPlayerIds={selectedPlayerIds}
							/>
						</div>
					</section>

					<section className="space-y-3">
						<div>
							<p className="font-bold">Placar</p>
							<p className="text-sm text-muted-foreground">
								Para jogo decidido no tiebreak, registre como 7–6.
							</p>
						</div>

						<div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
							<div className="space-y-2">
								<Label htmlFor="games-a">Dupla A</Label>
								<Input
									id="games-a"
									value={gamesA}
									onChange={(event) => setGamesA(event.target.value)}
									type="number"
									min="0"
									inputMode="numeric"
									className="h-14 text-center text-2xl font-black"
								/>
							</div>

							<div className="pb-4 text-2xl font-black text-muted-foreground">
								–
							</div>

							<div className="space-y-2">
								<Label htmlFor="games-b">Dupla B</Label>
								<Input
									id="games-b"
									value={gamesB}
									onChange={(event) => setGamesB(event.target.value)}
									type="number"
									min="0"
									inputMode="numeric"
									className="h-14 text-center text-2xl font-black"
								/>
							</div>
						</div>
					</section>

					{error && (
						<div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
							{error}
						</div>
					)}

					{successMessage && (
						<div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm">
							{successMessage}
						</div>
					)}

					<Button type="submit" className="h-12 w-full" disabled={isSubmitting}>
						{isSubmitting ? 'Salvando...' : 'Salvar partida'}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function getWinnerLabel(gamesA: number, gamesB: number) {
	if (Number.isNaN(gamesA) || Number.isNaN(gamesB)) return null;
	if (gamesA === gamesB) return null;

	return gamesA > gamesB ? 'A' : 'B';
}

type PlayerSelectProps = {
	players: Player[];
	selectedPlayerIds: string[];
	value: string;
	onChange: (value: string) => void;
	label: string;
};

function PlayerSelect({
						  players,
						  selectedPlayerIds,
						  value,
						  onChange,
						  label,
					  }: PlayerSelectProps) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>

			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="h-12">
					<SelectValue placeholder="Selecionar jogador" />
				</SelectTrigger>

				<SelectContent>
					{players.map((player) => {
						const isSelectedElsewhere =
							selectedPlayerIds.includes(player.id) && player.id !== value;

						return (
							<SelectItem
								key={player.id}
								value={player.id}
								disabled={isSelectedElsewhere}
							>
								{player.name}
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}