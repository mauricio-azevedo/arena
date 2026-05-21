import { apiRequest } from '@/lib/api-client';
import type { ProfileMatchListItem } from '../types/profile-match-list-item.type';

export function getProfileMatches(token: string): Promise<ProfileMatchListItem[]> {
  return apiRequest<ProfileMatchListItem[]>('/me/profile/matches', {
    token,
    cache: 'no-store',
  });
}
