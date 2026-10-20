import type { ProfileSummary } from '@arena/contracts/profiles';
import { apiRequest } from '@/lib/api-client';

export function getPublicProfileSummary(userId: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>(`/users/${userId}/profile/summary`, {
    cache: 'no-store',
  });
}
