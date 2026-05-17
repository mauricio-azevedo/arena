'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/api';
import type { Player } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
	const [message, setMessage] = useState<string | null>(null);

	const selectedPlayerIds = useMemo(
		() =>
			[
				teamAPlayer1Id,
				teamAPlayer2Id,
				teamBPlayer1Id,
				teamBPlayer2Id,
			].filter(Boolean),
		[teamAPlayer1Id, teamAPlayer2Id, teamBPlayer1Id, teamBPlayer2Id],
	);

	const winner = getWinner(Number(gamesA), Number(gamesB));

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setMessage(null);

		const playerIds = [
			teamAPlayer1Id,
			teamAPlayer2Id,
			teamBPlayer1Id,
			teamBPlayer2Id,
		];

		if (playerIds.some((id) => !id)) {
			setMessage('Selecione os quatro jogadores.');
			return;
		}

		if (new Set(playerIds).size !== 4) {
			setMessage('O mesmo jogador não pode aparecer duas vezes.');
			return;
		}

		const parsedGamesA = Number(gamesA);
		const parsedGamesB = Number(gamesB);

		if (
			Number.isNaN(parsedGamesA) ||
			Number.isNaN(parsedGamesB) ||
			parsedGamesA < 0 ||
			parsedGamesB < 0 ||
			parsedGamesA === parsedGamesB
		) {
			setMessage('Informe um placar com vencedor. No tiebreak, use 7–6.');
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

			setTeamAPlayer1Id('');
			setTeamAPlayer2Id('');
			setTeamBPlayer1Id('');
			setTeamBPlayer2Id('');
			setGamesA('6');
			setGamesB('4');
			setMessage('Partida salva.');

			router.refresh();
		} catch {
			setMessage('Não foi possível salvar. Tente novamente.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="mt-6 space-y-4">
			<Card>
				<CardContent className="space-y-5 p-4">
					<TeamSection
						title="Dupla A"
						isWinner={winner === 'A'}
						players={players}
						selectedPlayerIds={selectedPlayerIds}
						player1Id={teamAPlayer1Id}
						player2Id={teamAPlayer2Id}
						onPlayer1Change={setTeamAPlayer1Id}
						onPlayer2Change={setTeamAPlayer2Id}
					/>

					<div className="h-px bg-border" />

					<TeamSection
						title="Dupla B"
						isWinner={winner === 'B'}
						players={players}
						selectedPlayerIds={selectedPlayerIds}
						player1Id={teamBPlayer1Id}
						player2Id={teamBPlayer2Id}
						onPlayer1Change={setTeamBPlayer1Id}
						onPlayer2Change={setTeamBPlayer2Id}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-4 p-4">
					<div>
						<Label className="text-base font-semibold">Placar</Label>
						<p className="mt-1 text-sm text-muted-foreground">
							Se terminar no tiebreak, registre como 7–6.
						</p>
					</div>

					<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
						<ScoreInput
							label="A"
							value={gamesA}
							onChange={setGamesA}
							isWinner={winner === 'A'}
						/>

						<span className="text-2xl font-semibold text-muted-foreground">
							–
						</span>

						<ScoreInput
							label="B"
							value={gamesB}
							onChange={setGamesB}
							isWinner={winner === 'B'}
						/>
					</div>
				</CardContent>
			</Card>

			{message && (
				<p className="px-1 text-center text-sm text-muted-foreground">
					{message}
				</p>
			)}

			<Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
				{isSubmitting ? 'Salvando...' : 'Salvar partida'}
			</Button>
		</form>
	);
}

type TeamSectionProps = {
	title: string;
	isWinner: boolean;
	players: Player[];
	selectedPlayerIds: string[];
	player1Id: string;
	player2Id: string;
	onPlayer1Change: (value: string) => void;
	onPlayer2Change: (value: string) => void;
};

function TeamSection({
						 title,
						 isWinner,
						 players,
						 selectedPlayerIds,
						 player1Id,
						 player2Id,
						 onPlayer1Change,
						 onPlayer2Change,
					 }: TeamSectionProps) {
	return (
		<section className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="text-base font-semibold">{title}</Label>

				{isWinner && (
					<span className="text-sm font-medium text-muted-foreground">
						vencedora
					</span>
				)}
			</div>

			<div className="grid grid-cols-2 gap-2">
				<PlayerSelect
					value={player1Id}
					onChange={onPlayer1Change}
					players={players}
					selectedPlayerIds={selectedPlayerIds}
					placeholder="Jogador 1"
				/>

				<PlayerSelect
					value={player2Id}
					onChange={onPlayer2Change}
					players={players}
					selectedPlayerIds={selectedPlayerIds}
					placeholder="Jogador 2"
				/>
			</div>
		</section>
	);
}

type PlayerSelectProps = {
	players: Player[];
	selectedPlayerIds: string[];
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
};

function PlayerSelect({
						  players,
						  selectedPlayerIds,
						  value,
						  onChange,
						  placeholder,
					  }: PlayerSelectProps) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="h-12">
				<SelectValue placeholder={placeholder} />
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
	);
}

type ScoreInputProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	isWinner: boolean;
};

function ScoreInput({ label, value, onChange, isWinner }: ScoreInputProps) {
	return (
		<div className="space-y-2">
			<Label className="block text-center text-sm text-muted-foreground">
				Dupla {label}
			</Label>

			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				type="number"
				min="0"
				inputMode="numeric"
				className={`h-16 text-center text-3xl font-semibold ${
					isWinner ? 'border-foreground' : ''
				}`}
			/>
		</div>
	);
}

function getWinner(gamesA: number, gamesB: number) {
	if (Number.isNaN(gamesA) || Number.isNaN(gamesB)) return null;
	if (gamesA === gamesB) return null;

	return gamesA > gamesB ? 'A' : 'B';
}