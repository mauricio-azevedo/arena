import { Player } from '@/types/api';

const API_BASE_URL = 'http://localhost:3000';

export async function getRanking(): Promise<Player[]> {
	const response = await fetch(`${API_BASE_URL}/ranking`, {
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error('Failed to fetch ranking');
	}

	return response.json();
}