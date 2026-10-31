import type { Group, GroupBody, GroupHomeCard, GroupMembership } from '@arena/contracts/groups';
import type { GroupMember, GuestMemberBody } from '@arena/contracts/members';
import type { RankingEntry } from '@arena/contracts/ranking';
import { apiRequest } from '@/lib/api-client';

export function getGroup(groupId: string): Promise<Group> {
  return apiRequest<Group>(`/groups/${groupId}`, {
    cache: 'no-store',
  });
}

export function getGroupHome(token?: string): Promise<GroupHomeCard[]> {
  return apiRequest<GroupHomeCard[]>('/groups/home', {
    token,
    cache: 'no-store',
  });
}

export function getAllGroups(token?: string): Promise<GroupHomeCard[]> {
  return apiRequest<GroupHomeCard[]>('/groups/home/all', {
    token,
    cache: 'no-store',
  });
}

export function getMyGroups(token: string): Promise<GroupMembership[]> {
  return apiRequest<GroupMembership[]>('/me/groups', {
    token,
    cache: 'no-store',
  });
}

export function createGroup(token: string, input: GroupBody): Promise<Group> {
  return apiRequest<Group>('/groups', {
    method: 'POST',
    token,
    body: input,
  });
}

export function getGroupRanking(groupId: string): Promise<RankingEntry[]> {
  return apiRequest<RankingEntry[]>(`/groups/${groupId}/ranking`, {
    cache: 'no-store',
  });
}

export function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  return apiRequest<GroupMember[]>(`/groups/${groupId}/members`, {
    cache: 'no-store',
  });
}

// Adds a guest (jogador sem conta) to the group — a GroupMember with userId null.
// Any active member may do it; the created member comes back for an optimistic refresh.
export function createGuestMember(
  token: string,
  groupId: string,
  input: GuestMemberBody,
): Promise<GroupMember> {
  return apiRequest<GroupMember>(`/groups/${groupId}/members/guest`, {
    method: 'POST',
    token,
    body: input,
  });
}
