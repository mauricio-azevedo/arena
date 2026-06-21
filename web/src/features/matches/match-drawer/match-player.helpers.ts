import type { GroupMember, Match } from '@/types/api';

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

// Literal class strings (not interpolated) so Tailwind keeps them in the build.
const AVATAR_BG_CLASSES = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4'] as const;

// Stable per-member colour so a player keeps the same avatar fill across the
// picker and both team cards.
export function avatarBgClass(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_BG_CLASSES[hash % AVATAR_BG_CLASSES.length];
}

function initialOf(name: string) {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

export function resolveFromMember(member: GroupMember): ResolvedPlayer {
  const firstName = member.user?.firstName?.trim() || 'Jogador';
  const lastName = member.user?.lastName?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();

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

      const firstName = player.groupMember?.user?.firstName?.trim() || 'Jogador';
      const lastName = player.groupMember?.user?.lastName?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();

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
