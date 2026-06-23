import { apiRequest } from '@/lib/api-client';
import type { MemberProfile } from '../types/member-profile.type';

export function getMemberProfile(groupId: string, memberId: string): Promise<MemberProfile> {
  return apiRequest<MemberProfile>(`/groups/${groupId}/members/${memberId}/profile`, {
    cache: 'no-store',
  });
}
