export type Player = {
	id: string;
	name: string;
	rating: number;
	createdAt: string;
	updatedAt: string;
};

export type Match = {
	id: string;
	teamAPlayer1Id: string;
	teamAPlayer2Id: string;
	teamBPlayer1Id: string;
	teamBPlayer2Id: string;
	gamesA: number;
	gamesB: number;
	ratingDeltaA: number;
	ratingDeltaB: number;
	createdAt: string;
	updatedAt: string;
	teamAPlayer1: Player;
	teamAPlayer2: Player;
	teamBPlayer1: Player;
	teamBPlayer2: Player;
};

export type CreateMatchInput = {
	teamAPlayer1Id: string;
	teamAPlayer2Id: string;
	teamBPlayer1Id: string;
	teamBPlayer2Id: string;
	gamesA: number;
	gamesB: number;
};

export type UpdateMatchInput = CreateMatchInput;