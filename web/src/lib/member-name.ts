// Resolves the name to show for a group member, mirroring the backend
// resolveMemberDisplayName: a chosen nickname (how you appear to others) wins;
// otherwise real members take first+last from the linked user, and stub players
// (jogadores sem conta) carry their name on displayName.
type MemberNameSource =
  | {
      user?: { firstName: string; lastName: string; nickname?: string | null } | null;
      displayName?: string | null;
    }
  | null
  | undefined;

export function resolveMemberName(member: MemberNameSource): {
  firstName: string;
  fullName: string;
} {
  // Nickname is the whole display name (not split), same as the backend.
  const nickname = member?.user?.nickname?.trim();
  if (nickname) {
    return { firstName: nickname, fullName: nickname };
  }

  const stubName = member?.displayName?.trim();
  const firstName = member?.user?.firstName?.trim() || stubName || 'Jogador';
  const lastName = member?.user ? member.user.lastName?.trim() || '' : '';
  const fullName = `${firstName} ${lastName}`.trim();

  return { firstName, fullName };
}
