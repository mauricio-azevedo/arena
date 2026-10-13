// Resolves the identity to show for a group member. Real members take their name and
// avatar color from the linked User; a set `nickname` is the name they chose to show
// others and wins over first+last. Stub players (jogadores sem conta) have a null user
// and carry their name in `displayName`. Falls back to a generic label so a missing
// name never surfaces as empty UI.
export type MemberNameSource = {
  user?: {
    firstName: string;
    lastName: string;
    nickname?: string | null;
    avatarColor?: string | null;
  } | null;
  displayName?: string | null;
};

// The single Prisma `user` select that feeds resolveMemberDisplayName /
// resolveMemberAvatarColor. Use this (`user: { select: MEMBER_USER_SELECT }`, or
// spread it when a select also needs `id`/`email`) so the identity fields can't be
// forgotten on a payload's avatar/name. Adding a 5th identity field happens here once.
export const MEMBER_USER_SELECT = {
  firstName: true,
  lastName: true,
  nickname: true,
  avatarColor: true,
} as const;

export function resolveMemberDisplayName(member: MemberNameSource): string {
  if (member.user) {
    const nickname = member.user.nickname?.trim();
    if (nickname) {
      return nickname;
    }

    const full = `${member.user.firstName} ${member.user.lastName}`.trim();
    if (full) {
      return full;
    }
  }

  const stub = member.displayName?.trim();
  if (stub) {
    return stub;
  }

  return 'Jogador';
}

// The member's chosen avatar palette key, or null for stubs / users without a pick
// (the client falls back to a deterministic fill).
export function resolveMemberAvatarColor(
  member: MemberNameSource,
): string | null {
  return member.user?.avatarColor ?? null;
}
