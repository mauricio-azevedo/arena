import type { ProfileSummary } from '@arena/contracts/profiles';
import type { AuthSession, UpdateProfileInput } from '@arena/contracts/me';
import { apiRequest } from '@/lib/api-client';

export function getProfileSummary(token: string): Promise<ProfileSummary> {
  return apiRequest<ProfileSummary>('/me/profile/summary', {
    token,
    cache: 'no-store',
  });
}

// A partial edit: send only what changed. The answer re-signs the token, which
// carries the e-mail.
export function updateProfile(token: string, input: UpdateProfileInput): Promise<AuthSession> {
  return apiRequest<AuthSession>('/me/profile', {
    method: 'PATCH',
    token,
    body: input,
  });
}
