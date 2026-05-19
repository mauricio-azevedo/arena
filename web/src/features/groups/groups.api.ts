import { apiRequest } from '@/lib/api-client';
import type { Group, GroupMember, MyGroup } from '@/types/api';

export function getGroups(): Promise<Group[]> {
  return apiRequest<Group[]>('/groups', {
    cache: 'no-store',
  });
}

export function getGroup(groupId: string): Promise<Group> {
  return apiRequest<Group>(`/groups/${groupId}`, {
    cache: 'no-store',
  });
}

export function getMyGroups(token: string): Promise<MyGroup[]> {
  return apiRequest<MyGroup[]>('/me/groups', {
    token,
    cache: 'no-store',
  });
}

export function createGroup(
  token: string,
  input: {
    name: string;
    description?: string;
  },
): Promise<Group> {
  return apiRequest<Group>('/groups', {
    method: 'POST',
    token,
    body: input,
  });
}

export function getGroupRanking(groupId: string): Promise<GroupMember[]> {
  return apiRequest<GroupMember[]>(`/groups/${groupId}/ranking`, {
    cache: 'no-store',
  });
}

export function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  return apiRequest<GroupMember[]>(`/groups/${groupId}/players`, {
    cache: 'no-store',
  });
}
