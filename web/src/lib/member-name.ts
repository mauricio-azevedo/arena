// Resolves the name to show for a group member, mirroring the backend
// resolveMemberDisplayName: real members take their name from the linked user;
// stub players (jogadores sem conta) carry their name on displayName.
type MemberNameSource =
  | { user?: { firstName: string; lastName: string } | null; displayName?: string | null }
  | null
  | undefined;

export function resolveMemberName(member: MemberNameSource): {
  firstName: string;
  fullName: string;
} {
  const stubName = member?.displayName?.trim();
  const firstName = member?.user?.firstName?.trim() || stubName || 'Jogador';
  const lastName = member?.user ? member.user.lastName?.trim() || '' : '';
  const fullName = `${firstName} ${lastName}`.trim();

  return { firstName, fullName };
}
