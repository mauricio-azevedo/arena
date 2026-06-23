import type { MatchTeam } from '../../generated/prisma/enums';

// Result of accepting a CLAIM invite. The shared-match case is not an error — it's a
// real outcome the claim page renders (the two proved to be different people), so it
// comes back as a 200 discriminated union rather than a thrown exception.

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
