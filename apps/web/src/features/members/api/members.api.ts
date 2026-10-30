import type { MemberProfile } from '@arena/contracts/members';
import { apiRequest } from '@/lib/api-client';

export function getMemberProfile(groupId: string, memberId: string): Promise<MemberProfile> {
  return apiRequest<MemberProfile>(`/groups/${groupId}/members/${memberId}/profile`, {
    cache: 'no-store',
  });
}
