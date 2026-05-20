import type { FeedItemType } from '../enums/feed-item-type.enum';
import type { FeedActorUser } from './feed-actor-user.type';
import type { FeedGroup } from './feed-group.type';

export type FeedItem = {
  id: string;
  type: FeedItemType;
  groupId: string;
  actorUserId: string | null;
  actorGroupMemberId: string | null;
  matchId: string | null;
  importanceScore: number;
  metadata: unknown;
  occurredAt: string;
  createdAt: string;
  group: FeedGroup;
  actorUser: FeedActorUser | null;
  isActorCurrentUser: boolean;
};
