// Shared shape for a player referenced in a feed item. userId is null for stub
// players (jogadores sem conta) — they have no linkable profile.
export type FeedPlayer = {
  groupMemberId: string;
  userId: string | null;
  displayName: string;
};
