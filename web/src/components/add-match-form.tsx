'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/lib/api';
import type { Player } from '@/types/api';

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

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const playerIds = [
			teamAPlayer1Id,
			teamAPlayer2Id,
			teamBPlayer1Id,
			teamBPlayer2Id,
		];

		if (playerIds.some((id) => !id)) return;
		if (new Set(playerIds).size !== 4) return;

		setIsSubmitting(true);

		try {
			await createMatch({
				teamAPlayer1Id,
				teamAPlayer2Id,
				teamBPlayer1Id,
				teamBPlayer2Id,
				gamesA: Number(gamesA),
				gamesB: Number(gamesB),
			});

			router.refresh();
		} finally {
			setIsSubmitting(false);
		}
	}

	function PlayerSelect({
							  value,
							  onChange,
							  label,
						  }: {
		value: string;
		onChange: (value: string) => void;
		label: string;
	}) {
		return (
			<label className="block">
				<span className="mb-1 block text-xs font-bold text-zinc-500">
					{label}
				</span>

				<select
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="w-full rounded-2xl bg-zinc-900 px-3 py-3 text-sm text-white outline-none ring-1 ring-zinc-800 focus:ring-amber-400"
				>
					<option value="">Selecionar</option>

					{players.map((player) => (
						<option key={player.id} value={player.id}>
							{player.name}
						</option>
					))}
				</select>
			</label>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mt-8 rounded-3xl bg-zinc-900 p-4"
		>
			<h2 className="text-lg font-black">Registrar partida</h2>

			<div className="mt-4 grid grid-cols-2 gap-3">
				<PlayerSelect
					label="Dupla A · jogador 1"
					value={teamAPlayer1Id}
					onChange={setTeamAPlayer1Id}
				/>

				<PlayerSelect
					label="Dupla A · jogador 2"
					value={teamAPlayer2Id}
					onChange={setTeamAPlayer2Id}
				/>

				<PlayerSelect
					label="Dupla B · jogador 1"
					value={teamBPlayer1Id}
					onChange={setTeamBPlayer1Id}
				/>

				<PlayerSelect
					label="Dupla B · jogador 2"
					value={teamBPlayer2Id}
					onChange={setTeamBPlayer2Id}
				/>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3">
				<input
					value={gamesA}
					onChange={(event) => setGamesA(event.target.value)}
					type="number"
					min="0"
					className="rounded-2xl bg-zinc-950 px-4 py-3 text-white outline-none ring-1 ring-zinc-800 focus:ring-amber-400"
				/>

				<input
					value={gamesB}
					onChange={(event) => setGamesB(event.target.value)}
					type="number"
					min="0"
					className="rounded-2xl bg-zinc-950 px-4 py-3 text-white outline-none ring-1 ring-zinc-800 focus:ring-amber-400"
				/>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				className="mt-4 w-full rounded-2xl bg-amber-400 px-4 py-3 font-black text-zinc-950 disabled:opacity-50"
			>
				Salvar partida
			</button>
		</form>
	);
}