import type { MatchTeam } from '../../generated/prisma/enums';

// Result of attaching an account to a stub (via claim link or admin-approved request).
// The shared-match case is a real outcome callers render (the two proved to be different
// people), not an error.

export type SharedMatchPlayer = {
  name: string;
  // Marks the two people the conflict is about, so the UI can highlight them.
  isStub: boolean;
  isYou: boolean;
};

export type SharedMatchTeam = {
  team: MatchTeam;
  score: number;
  won: boolean;
  players: SharedMatchPlayer[];
};

export type SharedMatch = {
  id: string;
  playedAt: Date;
  teams: SharedMatchTeam[];
};

export type ClaimAdmin = {
  groupMemberId: string;
  name: string;
};

export type ClaimBlocked = {
  outcome: 'BLOCKED';
  stubName: string;
  sharedMatches: SharedMatch[];
  admins: ClaimAdmin[];
};
