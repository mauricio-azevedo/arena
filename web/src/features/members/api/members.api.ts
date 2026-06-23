import { apiRequest } from '@/lib/api-client';
import type { GroupInvite } from '@/types/api';
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
