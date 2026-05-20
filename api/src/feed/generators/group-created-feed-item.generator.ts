import { Injectable } from '@nestjs/common';
import { FeedItemType } from '../../generated/prisma/enums';
import { FeedItemGenerator } from '../types/feed-item-generator.type';
import { GroupCreatedFeedInput } from '../types/group-created-feed-input.type';
import { FeedItemDraft } from '../types/feed-item-draft.type';

@Injectable()
export class GroupCreatedFeedItemGenerator implements FeedItemGenerator<GroupCreatedFeedInput> {
  generate(input: GroupCreatedFeedInput): FeedItemDraft {
    return {
      type: FeedItemType.GROUP_CREATED,
      groupId: input.groupId,
      actorUserId: input.actorUserId,
      actorGroupMemberId: input.actorGroupMemberId,
      importanceScore: 25,
      occurredAt: input.occurredAt,
      metadata: {
        groupName: input.groupName,
      },
    };
  }
}
