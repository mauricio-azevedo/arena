export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC';
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

export type MatchTeam = 'TEAM_A' | 'TEAM_B';

export type MatchPlayer = {
  id: string;
  matchId: string;
  groupId: string;
  groupMemberId: string;
  displayNameSnapshot: string;
  team: MatchTeam;
  position: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;

  ratingDeviationBefore: number | null;
  ratingDeviationAfter: number | null;
  ratingVolatilityBefore: number | null;
  ratingVolatilityAfter: number | null;
  ratingMuBefore: number | null;
  ratingMuAfter: number | null;
  ratingSigmaBefore: number | null;
  ratingSigmaAfter: number | null;

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
  winnerTeam: MatchTeam;
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
  players: MatchPlayer[];
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
