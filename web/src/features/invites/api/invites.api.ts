import { apiRequest } from '@/lib/api-client';
import type { Group, GroupInvite, User } from '@/types/api';

export function createGroupInvite(token: string, groupId: string): Promise<GroupInvite> {
  return apiRequest<GroupInvite>(`/groups/${groupId}/invites`, {
    method: 'POST',
    token,
    body: {},
  });
}

export function getInvite(token: string): Promise<GroupInvite> {
  return apiRequest<GroupInvite>(`/invites/${token}`, {
    cache: 'no-store',
  });
}

export function acceptInvite(
  authToken: string,
  inviteToken: string,
): Promise<{
  id: string;
  groupId: string;
  userId: string | null;
  // Null when a stub is claimed (the name then comes from the linked account).
  displayName: string | null;
  rating: number;
  role: 'ADMIN' | 'MEMBER';
  group: Group;
  user: User;
}> {
  return apiRequest(`/invites/${inviteToken}/accept`, {
    method: 'POST',
    token: authToken,
  });
}
