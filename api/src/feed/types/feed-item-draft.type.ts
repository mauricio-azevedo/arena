import type { Prisma } from '../../generated/prisma/client';
import { FeedItemType } from '../../generated/prisma/enums';

export type FeedItemDraft = {
  type: FeedItemType;
  groupId: string;
  actorUserId?: string | null;
  actorGroupMemberId?: string | null;
  matchId?: string | null;
  importanceScore: number;
  metadata: Prisma.InputJsonObject;
  occurredAt: Date;
};
