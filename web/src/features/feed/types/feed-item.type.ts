import type { FeedItemScope } from '../enums/feed-item-scope.enum';
import type { FeedItemType } from '../enums/feed-item-type.enum';
import type { FeedItemVisibility } from '../enums/feed-item-visibility.enum';
import type { FeedActorUser } from './feed-actor-user.type';
import type { FeedGroup } from './feed-group.type';
import type { FeedSubjectUser } from './feed-subject-user.type';

export type FeedItem = {
  id: string;
  type: FeedItemType;
  scope: FeedItemScope;
  visibility: FeedItemVisibility;

  groupId: string | null;
  actorUserId: string | null;
  actorGroupMemberId: string | null;
  subjectUserId: string | null;
  matchId: string | null;

  importanceScore: number;
  feedScore: number;

  metadata: unknown;
  occurredAt: string;
  createdAt: string;

  isActorCurrentUser: boolean;
  isSubjectCurrentUser: boolean;

  group: FeedGroup | null;
  actorUser: FeedActorUser | null;
  subjectUser: FeedSubjectUser | null;
};
