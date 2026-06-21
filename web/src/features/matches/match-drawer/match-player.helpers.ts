import type { GroupMember, Match } from '@/types/api';
import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { resolveMemberName } from '@/lib/member-name';

// Re-exported so existing drawer call-sites keep importing from here.
export { avatarBgClass };

// A player as the drawer needs to render it — resolved either from the live
// group roster or, when editing, from the match's own snapshot (so a member who
// has since left the group still shows up in a filled slot).
export type ResolvedPlayer = {
  id: string;
  firstName: string;
  fullName: string;
  initial: string;
  avatarSeed: string;
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
    avatarSeed: member.id,
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
        avatarSeed: player.groupMemberId,
      });
    }
  }

  return lookup;
}
