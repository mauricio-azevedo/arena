import type { Group } from '@arena/contracts/groups';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string | null;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
};

// A lightweight roster row on the open invite: just enough to self-recognize.
export type InviteGuest = {
  groupMemberId: string;
  displayName: string;
  matchesCount: number;
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
  // null → open invite (group link); set → closed invite addressed to that guest.
  targetGroupMemberId: string | null;
  createdAt: string;
  updatedAt: string;
  path: string;
  group?: Group;
  createdBy?: User;
  // Present on GET /invites/:token. OPEN → the `guests` roster; CLOSED → the `target`
  // recognition. A closed invite whose target was already taken over (or left) degrades to
  // OPEN + `targetUnavailable`, so the opener still has a way in.
  kind?: 'OPEN' | 'CLOSED';
  guests?: InviteGuest[];
  target?: ClaimStubSummary;
  targetUnavailable?: boolean;
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

export type NotificationType =
  | 'CLAIM_OFFER'
  | 'CLAIM_OFFER_DECLINED'
  // Deprecated — pre-email-anchored claim flow (no longer generated).
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

// The email-anchored claim offer a recipient reviews (legacy flow, recipient side —
// invites via link superseded the admin-side email anchoring, ADR 0004).
export type ClaimOfferDetail = {
  stubGroupMemberId: string;
  groupId: string;
  groupName: string;
  stub: ClaimStubSummary;
};
