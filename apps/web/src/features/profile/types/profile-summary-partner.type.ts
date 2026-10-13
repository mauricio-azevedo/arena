export type ProfileSummaryPartner = {
  // Null for stub partners (jogadores sem conta).
  userId: string | null;
  displayName: string;
  // Partner's chosen avatar palette key (null for stubs / no pick).
  avatarColor: string | null;
  // Partner's current rank, from the group you've played the most together; null
  // when unranked.
  currentRank: number | null;
  matchesTogether: number;
  winsTogether: number;
  lossesTogether: number;
  // 0–100, rounded.
  winRate: number;
};
