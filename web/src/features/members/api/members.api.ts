import { apiRequest } from '@/lib/api-client';
import type { GroupInvite, GroupMember } from '@/types/api';
import type { MemberProfile } from '../types/member-profile.type';

export function getMemberProfile(
  groupId: string,
  memberId: string,
): Promise<MemberProfile> {
  return apiRequest<MemberProfile>(
    `/groups/${groupId}/members/${memberId}/profile`,
    { cache: 'no-store' },
  );
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

// Admin: reverts a claim — detaches the account, turning the member back into a stub.
export function unlinkMember(
  token: string,
  groupId: string,
  memberId: string,
): Promise<GroupMember> {
  return apiRequest<GroupMember>(
    `/groups/${groupId}/members/${memberId}/unlink`,
    { method: 'POST', token },
  );
}
