import type { GroupMember, Match } from '@/types/api';
import { nameInitial } from '@/lib/avatar';
import { resolveMemberName } from '@/lib/member-name';

// A player as the drawer needs to render it — resolved either from the live
// group roster or, when editing, from the match's own snapshot (so a member who
// has since left the group still shows up in a filled slot).
export type ResolvedPlayer = {
  id: string;
  firstName: string;
  fullName: string;
  initial: string;
  // The member's chosen avatar palette key (null → stub/default fill).
  avatarColor: string | null;
  // null → jogador sem conta (convidado), rendered as a dashed avatar.
  userId: string | null;
};

function initialOf(name: string) {
  return nameInitial(name);
}

export function resolveFromMember(member: GroupMember): ResolvedPlayer {
  const { firstName, fullName } = resolveMemberName(member);

  return {
    id: member.id,
    firstName,
    fullName,
    initial: initialOf(firstName),
    avatarColor: member.user?.avatarColor ?? null,
    userId: member.userId,
  };
}

// Lookup keyed by groupMemberId, merging the live roster with the match snapshot
// so edit mode can always name its four players.
export function buildPlayerLookup(members: GroupMember[], match?: Match) {
  const lookup = new Map<string, ResolvedPlayer>();

  for (const member of members) {
    lookup.set(member.id, resolveFromMember(member));
  }

  if (match) {
    for (const player of match.players) {
      if (lookup.has(player.groupMemberId)) {
        continue;
      }

      const { firstName, fullName } = resolveMemberName(player.groupMember);

      lookup.set(player.groupMemberId, {
        id: player.groupMemberId,
        firstName,
        fullName,
        initial: initialOf(firstName),
        avatarColor: player.groupMember?.user?.avatarColor ?? null,
        userId: player.groupMember?.userId ?? null,
      });
    }
  }

  return lookup;
}
