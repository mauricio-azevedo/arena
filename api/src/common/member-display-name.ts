// Resolves the name to show for a group member. Real members take their name from
// the linked User; stub players (jogadores sem conta) have a null user and carry
// their name in `displayName`. Falls back to a generic label as a last resort so a
// missing name never surfaces as empty UI.
export type MemberNameSource = {
  user?: { firstName: string; lastName: string } | null;
  displayName?: string | null;
};

export function resolveMemberDisplayName(member: MemberNameSource): string {
  if (member.user) {
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
