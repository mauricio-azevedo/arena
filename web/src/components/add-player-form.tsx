'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPlayer } from '@/lib/api';

export function AddPlayerForm() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmedName = name.trim();

		if (!trimmedName) return;

		setIsSubmitting(true);

		try {
			await createPlayer(trimmedName);
			setName('');
			router.refresh();
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="mt-8 flex gap-2">
			<input
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder="Nome do jogador"
				className="min-w-0 flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none ring-1 ring-zinc-800 placeholder:text-zinc-500 focus:ring-amber-400"
			/>

			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 disabled:opacity-50"
			>
				Adicionar
			</button>
		</form>
	);
}