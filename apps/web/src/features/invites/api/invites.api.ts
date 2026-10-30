import type { ClaimMembership, ClaimResult } from '@arena/contracts/claims';
import type { CreatedInvite, PublicInvite } from '@arena/contracts/invites';
import { apiRequest } from '@/lib/api-client';

// Without a target this is the group's open invite; with `targetGroupMemberId` it is a
// closed invite addressed to that guest. Plain requests reuse the active invite server-side,
// so the returned link is stable across calls.
export function createGroupInvite(
  token: string,
  groupId: string,
  opts: { targetGroupMemberId?: string } = {},
): Promise<CreatedInvite> {
  return apiRequest<CreatedInvite>(`/groups/${groupId}/invites`, {
    method: 'POST',
    token,
    body: opts.targetGroupMemberId ? { targetGroupMemberId: opts.targetGroupMemberId } : {},
  });
}

export function getInvite(token: string): Promise<PublicInvite> {
  return apiRequest<PublicInvite>(`/invites/${token}`, {
    cache: 'no-store',
  });
}

// Join as a new member. Someone who is already in the group keeps the membership
// they have, history included.
export function acceptInvite(authToken: string, inviteToken: string): Promise<ClaimMembership> {
  return apiRequest(`/invites/${inviteToken}/accept`, {
    method: 'POST',
    token: authToken,
  });
}

// Take over a guest via the invite (open-list pick or closed target). CLAIMED → the new
// membership; BLOCKED → a shared-match conflict. Requires an account (called post-auth).
export function claimInviteGuest(
  authToken: string,
  inviteToken: string,
  guestId: string,
): Promise<ClaimResult> {
  return apiRequest<ClaimResult>(`/invites/${inviteToken}/claim/${guestId}`, {
    method: 'POST',
    token: authToken,
  });
}
