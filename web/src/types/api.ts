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

export type RankingMovement = {
  direction: 'UP' | 'DOWN';
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  sourceMatchId: string;
  occurredAt: string;
};

export type GroupMemberStats = {
  matchesCount: number;
  winsCount: number;
};

export type GroupMember = {
  id: string;
  groupId: string;
  // Null for stub players (jogadores sem conta); displayName carries their name.
  userId: string | null;
  displayName: string | null;
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
  stats?: GroupMemberStats;
  rankingMovement?: RankingMovement | null;
};

export type MyGroup = {
  id: string;
  role: GroupMemberRole;
  rating: number;
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
  // Set when the invite is a CLAIM for a specific stub player.
  targetGroupMemberId?: string | null;
  kind?: 'JOIN' | 'CLAIM';
  targetDisplayName?: string | null;
  // The stub's history shown on the claim page (CLAIM invites only).
  stub?: ClaimStubSummary | null;
};

// One of the stub's recent matches, from the stub's own perspective.
export type ClaimRecentMatch = {
  id: string;
  result: 'WIN' | 'LOSS';
  partners: string[];
  opponents: string[];
  scoreFor: number;
  scoreAgainst: number;
  playedAt: string;
};

export type ClaimStubSummary = {
  groupMemberId: string;
  displayName: string;
  rank: number | null;
  rating: number;
  matchesCount: number;
  recentMatches: ClaimRecentMatch[];
};

// Result of accepting a CLAIM invite. The shared-match case is a real outcome the
// claim page renders (the two proved to be different people), not an error.
export type SharedMatchPlayer = {
  name: string;
  isStub: boolean;
  isYou: boolean;
};

export type SharedMatchTeam = {
  team: 'TEAM_A' | 'TEAM_B';
  score: number;
  won: boolean;
  players: SharedMatchPlayer[];
};

export type SharedMatch = {
  id: string;
  playedAt: string;
  teams: SharedMatchTeam[];
};

export type ClaimAdmin = {
  groupMemberId: string;
  name: string;
};

export type ClaimMembership = {
  id: string;
  groupId: string;
  userId: string | null;
  displayName: string | null;
  rating: number;
  role: 'ADMIN' | 'MEMBER';
  group: Group;
  user: User;
};

export type AcceptClaimResult =
  | { outcome: 'CLAIMED'; membership: ClaimMembership }
  | {
      outcome: 'BLOCKED';
      stubName: string;
      sharedMatches: SharedMatch[];
      admins: ClaimAdmin[];
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
  team: MatchTeam;
  position: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;

  rankBefore: number | null;
  rankAfter: number | null;
  rankDelta: number | null;
  movementDirection: 'UP' | 'DOWN' | null;
  movementPositions: number | null;

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

export type NotificationType =
  | 'CLAIM_REQUEST'
  | 'CLAIM_APPROVED'
  | 'CLAIM_DECLINED'
  | 'CLAIM_INVITE';

export type NotificationAction = { label: string; href: string };

// In-app notification. `data` is a denormalized render payload frozen at write time.
export type AppNotification = {
  id: string;
  type: NotificationType;
  groupId: string | null;
  actorUserId: string | null;
  data: {
    title?: string;
    body?: string;
    meta?: string;
    actions?: NotificationAction[];
  };
  read: boolean;
  acted: boolean;
  createdAt: string;
};

export type ClaimRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';

export type ClaimRequestDetail = {
  id: string;
  status: ClaimRequestStatus;
  groupId: string;
  groupName: string;
  stub: {
    groupMemberId: string | null;
    name: string;
    rank: number | null;
    rating: number | null;
    matchesCount: number;
  };
  requester: { userId: string; name: string };
  hasConflict: boolean;
  createdAt: string;
  resolvedAt: string | null;
};

export type CreateClaimRequestResult =
  | { outcome: 'REQUESTED'; requestId: string; status: ClaimRequestStatus }
  | {
      outcome: 'BLOCKED';
      stubName: string;
      sharedMatches: SharedMatch[];
      admins: ClaimAdmin[];
    };
