export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    matches: number;
  };
};

export type GroupMemberRole = 'ADMIN' | 'MEMBER';

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  displayName: string;
  rating: number;
  ratingDeviation: number | null;
  ratingVolatility: number | null;
  ratingMu: number | null;
  ratingSigma: number | null;
  ratingAlgorithm: string;
  role: GroupMemberRole;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  group?: Group;
};

export type MyGroup = {
  id: string;
  role: GroupMemberRole;
  rating: number;
  displayName: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
  group: Group;
};

export type GroupInvite = {
  id: string;
  token: string;
  groupId: string;
  createdById: string;
  expiresAt: string | null;
  revokedAt: string | null;
  uses: number;
  maxUses: number | null;
  createdAt: string;
  updatedAt: string;
  path: string;
  group?: Group;
  createdBy?: User;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
};

// Tipos antigos mantidos temporariamente para não quebrar telas antigas.
// Depois vamos remover ou substituir por GroupMember.
export type Player = {
  id: string;
  name?: string;
  displayName?: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
};

export type MatchParticipant = {
  id: string;
  matchId: string;
  groupId: string;
  groupMemberId: string;
  displayNameSnapshot: string;
  team: 'TEAM_A' | 'TEAM_B';
  position: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  playedAt: string;
  createdAt: string;
  updatedAt: string;
  groupMember?: GroupMember;
};

export type Match = {
  id: string;
  groupId: string;
  gamesA: number;
  gamesB: number;
  winnerTeam: 'TEAM_A' | 'TEAM_B';
  teamAExpected: number | null;
  teamBExpected: number | null;
  teamAActual: number | null;
  teamBActual: number | null;
  teamARatingBefore: number | null;
  teamBRatingBefore: number | null;
  teamARatingAfter: number | null;
  teamBRatingAfter: number | null;
  ratingAlgorithm: string;
  playedAt: string;
  createdAt: string;
  updatedAt: string;
  participants: MatchParticipant[];

  // Campos antigos mantidos temporariamente para as telas legadas.
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  teamAPlayer1: Player;
  teamAPlayer2: Player;
  teamBPlayer1: Player;
  teamBPlayer2: Player;
  ratingDeltaA: number;
  ratingDeltaB: number;
};

export type CreateMatchInput = {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  gamesA: number;
  gamesB: number;
  playedAt?: string;
};

export type UpdateMatchInput = CreateMatchInput;
