import { apiRequest } from '@/lib/api-client';
import type { ProfileSummary } from './tabs/summary/types/profile-summary.type';

export function getProfileSummary(token: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>('/me/profile/summary', {
    token,
    cache: 'no-store',
  });
}
