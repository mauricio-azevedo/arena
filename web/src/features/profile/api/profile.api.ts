import { apiRequest } from '@/lib/api-client';
import type { MyGroup } from '@/types/api';
import type { ProfileSummary } from '../tabs/summary/types/profile-summary.type';

export function getProfileSummary(token: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>('/me/profile/summary', {
    token,
    cache: 'no-store',
  });
}

export function getUserProfileSummary(userId: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>(`/users/${userId}/profile/summary`, {
    cache: 'no-store',
  });
}

export function getUserGroups(userId: string): Promise<MyGroup[]> {
  return apiRequest<MyGroup[]>(`/users/${userId}/groups`, {
    cache: 'no-store',
  });
}
