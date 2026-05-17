import type {
	CreateMatchInput,
	Match,
	Player,
	UpdateMatchInput,
} from '@/types/api';

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export async function getRanking(): Promise<Player[]> {
	const response = await fetch(`${API_BASE_URL}/ranking`, {
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error('Failed to fetch ranking');
	}

	return response.json();
}

export async function createPlayer(name: string): Promise<Player> {
	const response = await fetch(`${API_BASE_URL}/players`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ name }),
	});

	if (!response.ok) {
		throw new Error('Failed to create player');
	}

	return response.json();
}

export async function createMatch(input: CreateMatchInput): Promise<Match> {
	const response = await fetch(`${API_BASE_URL}/matches`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error('Failed to create match');
	}

	return response.json();
}

export async function getMatches(): Promise<Match[]> {
	const response = await fetch(`${API_BASE_URL}/matches`, {
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error('Failed to fetch matches');
	}

	return response.json();
}

export async function updateMatch(
	id: string,
	input: UpdateMatchInput,
): Promise<Match> {
	const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error('Failed to update match');
	}

	return response.json();
}