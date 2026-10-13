import type { ClaimEmailStatus } from '../../generated/prisma/enums';
import type { ClaimStubSummary } from '../../claims/types/claim-summary.type';

// What the stub drawer shows the admin about the email they anchored.
export type ClaimEmailState = {
  email: string | null;
  status: ClaimEmailStatus | null;
  notified: boolean;
  // True when an account with that email already exists (the offer is deliverable now).
  accountExists: boolean;
};

// What the confirm screen loads for the person the offer points at.
export type ClaimOfferDetail = {
  stubGroupMemberId: string;
  groupId: string;
  groupName: string;
  stub: ClaimStubSummary;
};
