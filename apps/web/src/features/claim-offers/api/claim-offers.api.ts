import type { ClaimDeclinedResponse, ClaimOfferDetail, ClaimResult } from '@arena/contracts/claims';
import { apiRequest } from '@/lib/api-client';

// --- Recipient: read / confirm / decline the offer (legacy email-anchored claims) ---

export function getClaimOffer(token: string, stubId: string): Promise<ClaimOfferDetail> {
  return apiRequest<ClaimOfferDetail>(`/me/claims/${stubId}`, {
    token,
    cache: 'no-store',
  });
}

export function confirmClaimOffer(token: string, stubId: string): Promise<ClaimResult> {
  return apiRequest<ClaimResult>(`/me/claims/${stubId}/confirm`, {
    method: 'POST',
    token,
  });
}

export function declineClaimOffer(token: string, stubId: string): Promise<ClaimDeclinedResponse> {
  return apiRequest(`/me/claims/${stubId}/decline`, { method: 'POST', token });
}
