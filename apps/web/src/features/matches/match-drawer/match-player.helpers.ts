import type { Match } from '@arena/contracts/matches';
import type { GroupMember } from '@arena/contracts/members';
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

// What the composer reads off a roster entry: identity for the picker and the
// lookup, `leftAt` to keep a member who left out of the pool. A `GroupMember`
// satisfies it as is; a draft guest is built as exactly this.
export type RosterMember = Pick<GroupMember, 'id' | 'userId' | 'displayName' | 'user' | 'leftAt'>;

// Prefix marking a guest named inline but not yet persisted. On submit, slots
// holding a draft id send the guest's name instead of a member id; the backend
// creates the stub atomically with the match.
const DRAFT_GUEST_PREFIX = 'draft:';

export function isDraftGuest(memberId: string) {
  return memberId.startsWith(DRAFT_GUEST_PREFIX);
}

// A local-only stub player: shaped as a roster member so it flows through the
// roster, picker and lookup unchanged, but never touches the network until the
// match is saved.
export function makeDraftGuest(name: string): RosterMember {
  return {
    id: `${DRAFT_GUEST_PREFIX}${crypto.randomUUID()}`,
    userId: null,
    displayName: name,
    user: null,
    leftAt: null,
  };
}

export function resolveFromMember(member: RosterMember): ResolvedPlayer {
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
export function buildPlayerLookup(members: RosterMember[], match?: Match) {
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
        avatarColor: player.groupMember.user?.avatarColor ?? null,
        userId: player.groupMember.userId,
      });
    }
  }

  return lookup;
}
