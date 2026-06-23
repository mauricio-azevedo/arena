import { apiRequest } from '@/lib/api-client';
import type { AuthResponse } from '@/types/api';
import type { ProfileSummary } from '../types/profile-summary.type';

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export function getProfileSummary(token: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>('/me/profile/summary', {
    token,
    cache: 'no-store',
  });
}

export function updateProfile(token: string, input: UpdateProfileInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/me/profile', {
    method: 'PATCH',
    token,
    body: input,
  });
}
