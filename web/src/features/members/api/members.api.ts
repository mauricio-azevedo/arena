import { apiRequest } from '@/lib/api-client';
import type { AcceptClaimResult, GroupInvite, UserSearchResult } from '@/types/api';
import type { MemberProfile } from '../types/member-profile.type';

// Search platform users by name/email — for an admin inviting someone to claim a stub.
export function searchUsers(token: string, query: string): Promise<UserSearchResult[]> {
  return apiRequest<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`, {
    token,
    cache: 'no-store',
  });
}

// Admin shortcut: take over the stub onto your own account immediately (no approval).
export function claimStubDirect(
  token: string,
  groupId: string,
  memberId: string,
): Promise<AcceptClaimResult> {
  return apiRequest<AcceptClaimResult>(`/groups/${groupId}/members/${memberId}/claim-self`, {
    method: 'POST',
    token,
  });
}

// Admin shortcut: send a chosen user an in-app invite to claim the stub.
export function inviteUserToClaim(
  token: string,
  groupId: string,
  memberId: string,
  targetUserId: string,
): Promise<{ ok: true }> {
  return apiRequest(`/groups/${groupId}/members/${memberId}/invite-to-claim`, {
    method: 'POST',
    token,
    body: { targetUserId },
  });
}

export function getMemberProfile(groupId: string, memberId: string): Promise<MemberProfile> {
  return apiRequest<MemberProfile>(`/groups/${groupId}/members/${memberId}/profile`, {
    cache: 'no-store',
  });
}

// Generates a single-use link for someone to take over a stub player's profile.
export function createMemberClaimLink(
  token: string,
  groupId: string,
  memberId: string,
): Promise<GroupInvite> {
  return apiRequest<GroupInvite>(`/groups/${groupId}/invites/claim`, {
    method: 'POST',
    token,
    body: { memberId },
  });
}
