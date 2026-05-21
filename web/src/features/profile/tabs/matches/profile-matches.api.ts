import { apiRequest } from '@/lib/api-client';
import { ProfileMatchListItem } from '@/features/profile/tabs/matches/types/profile-match-list-item.type';

export function getProfileMatches(token: string): Promise<ProfileMatchListItem[]> {
  return apiRequest<ProfileMatchListItem[]>('/me/profile/matches', {
    token,
    cache: 'no-store',
  });
}
