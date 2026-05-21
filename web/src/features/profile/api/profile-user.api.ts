import { apiRequest } from '@/lib/api-client';
import type { MyGroup } from '@/types/api';
import type { ProfileSummary } from '../tabs/summary/types/profile-summary.type';
import type { ProfileMatchListItem } from '../tabs/matches/types/profile-match-list-item.type';

export function getPublicProfileSummary(userId: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>(`/users/${userId}/profile/summary`, {
    cache: 'no-store',
  });
}

export function getPublicProfileMatches(userId: string): Promise<ProfileMatchListItem[]> {
  return apiRequest<ProfileMatchListItem[]>(`/users/${userId}/profile/matches`, {
    cache: 'no-store',
  });
}

export function getPublicProfileGroups(userId: string): Promise<MyGroup[]> {
  return apiRequest<MyGroup[]>(`/users/${userId}/groups`, {
    cache: 'no-store',
  });
}
