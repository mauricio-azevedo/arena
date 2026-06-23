import { apiRequest } from '@/lib/api-client';
import type { AcceptClaimResult, ClaimEmailState, ClaimOfferDetail } from '@/types/api';

// --- Admin: anchor / clear / read the email on a stub ---

export function setClaimEmail(
  token: string,
  groupId: string,
  memberId: string,
  email: string,
): Promise<ClaimEmailState> {
  return apiRequest<ClaimEmailState>(`/groups/${groupId}/members/${memberId}/claim-email`, {
    method: 'POST',
    token,
    body: { email },
  });
}

export function clearClaimEmail(
  token: string,
  groupId: string,
  memberId: string,
): Promise<ClaimEmailState> {
  return apiRequest<ClaimEmailState>(`/groups/${groupId}/members/${memberId}/claim-email`, {
    method: 'DELETE',
    token,
  });
}

export function getClaimEmailState(
  token: string,
  groupId: string,
  memberId: string,
): Promise<ClaimEmailState> {
  return apiRequest<ClaimEmailState>(`/groups/${groupId}/members/${memberId}/claim-email`, {
    token,
    cache: 'no-store',
  });
}

// --- Recipient: read / confirm / decline the offer ---

export function getClaimOffer(token: string, stubId: string): Promise<ClaimOfferDetail> {
  return apiRequest<ClaimOfferDetail>(`/me/claims/${stubId}`, {
    token,
    cache: 'no-store',
  });
}

export function confirmClaimOffer(token: string, stubId: string): Promise<AcceptClaimResult> {
  return apiRequest<AcceptClaimResult>(`/me/claims/${stubId}/confirm`, {
    method: 'POST',
    token,
  });
}

export function declineClaimOffer(token: string, stubId: string): Promise<{ outcome: 'DECLINED' }> {
  return apiRequest(`/me/claims/${stubId}/decline`, { method: 'POST', token });
}
