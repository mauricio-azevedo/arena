// The stub player's public-facing summary shown on the claim page (`/claim/<token>`),
// so the person opening the link recognizes the profile they're taking over.

export type ClaimRecentMatch = {
  id: string;
  result: 'WIN' | 'LOSS';
  // The stub's partner(s) and opponents, from the stub's perspective.
  partners: string[];
  opponents: string[];
  scoreFor: number;
  scoreAgainst: number;
  playedAt: Date;
};

export type ClaimStubSummary = {
  groupMemberId: string;
  displayName: string;
  rank: number | null;
  rating: number;
  matchesCount: number;
  recentMatches: ClaimRecentMatch[];
};
