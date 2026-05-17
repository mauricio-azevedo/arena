'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPlayer } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
		<Card className="mt-6">
			<CardHeader>
				<CardTitle>Novo jogador</CardTitle>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="player-name">Nome</Label>

						<Input
							id="player-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Ex: João Silva"
						/>
					</div>

					<Button type="submit" className="w-full" disabled={isSubmitting}>
						{isSubmitting ? 'Adicionando...' : 'Adicionar jogador'}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}