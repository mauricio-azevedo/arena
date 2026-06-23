import { apiRequest } from '@/lib/api-client';
import type { ClaimRequestDetail, CreateClaimRequestResult } from '@/types/api';

// Request to claim a stub when there's no link — goes to the group's admins for approval.
export function createClaimRequest(
  token: string,
  groupId: string,
  memberId: string,
): Promise<CreateClaimRequestResult> {
  return apiRequest<CreateClaimRequestResult>(`/groups/${groupId}/claim-requests`, {
    method: 'POST',
    token,
    body: { memberId },
  });
}

export function getClaimRequest(token: string, id: string): Promise<ClaimRequestDetail> {
  return apiRequest<ClaimRequestDetail>(`/claim-requests/${id}`, {
    token,
    cache: 'no-store',
  });
}

export function approveClaimRequest(
  token: string,
  id: string,
): Promise<{ outcome: 'APPROVED'; requestId: string }> {
  return apiRequest(`/claim-requests/${id}/approve`, { method: 'POST', token });
}

export function declineClaimRequest(
  token: string,
  id: string,
): Promise<{ outcome: 'DECLINED'; requestId: string }> {
  return apiRequest(`/claim-requests/${id}/decline`, { method: 'POST', token });
}
