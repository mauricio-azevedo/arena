import { apiRequest } from '@/lib/api-client';
import type { ProfileSummary } from '../types/profile-summary.type';

export function getPublicProfileSummary(userId: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>(`/users/${userId}/profile/summary`, {
    cache: 'no-store',
  });
}
