import type { Prisma } from '../../generated/prisma/client';
import {
  FeedItemScope,
  FeedItemType,
  FeedItemVisibility,
} from '../../generated/prisma/enums';

export type FeedItemDraft = {
  type: FeedItemType;
  scope: FeedItemScope;
  visibility: FeedItemVisibility;
  groupId?: string | null;
  actorUserId?: string | null;
  actorGroupMemberId?: string | null;
  subjectUserId?: string | null;
  matchId?: string | null;
  importanceScore: number;
  metadata: Prisma.InputJsonObject;
  occurredAt: Date;
};
