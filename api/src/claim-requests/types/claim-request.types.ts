import type { ClaimRequestStatus } from '../../generated/prisma/enums';
import type { ClaimBlocked } from '../../claims/types/claim-result.type';

export type CreateClaimRequestResult =
  | { outcome: 'REQUESTED'; requestId: string; status: ClaimRequestStatus }
  | ClaimBlocked;

// What the admin review screen (and the requester) read for one request.
export type ClaimRequestDetail = {
  id: string;
  status: ClaimRequestStatus;
  groupId: string;
  groupName: string;
  stub: {
    groupMemberId: string | null;
    name: string;
    rank: number | null;
    rating: number | null;
    matchesCount: number;
  };
  requester: { userId: string; name: string };
  // True only while the stub still exists and the requester is a member who shared a
  // match with it — the case approval can't proceed.
  hasConflict: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
};
