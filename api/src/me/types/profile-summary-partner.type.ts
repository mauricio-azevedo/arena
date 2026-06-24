export type ProfileSummaryPartner = {
  // Null for stub partners (jogadores sem conta) — no linkable profile, never merged
  // across groups.
  userId: string | null;
  displayName: string;
  // Partner's chosen avatar palette key (null for stubs / no pick).
  avatarColor: string | null;
  // Partner's current rank, taken from the group where you've played the most
  // together; null when unranked. Ambiguous once a partner is merged across groups,
  // so it's a hint, not a precise per-group figure.
  currentRank: number | null;
  matchesTogether: number;
  winsTogether: number;
  lossesTogether: number;
  // 0–100, rounded.
  winRate: number;
};
