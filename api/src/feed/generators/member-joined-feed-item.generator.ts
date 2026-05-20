import { Injectable } from '@nestjs/common';
import { FeedItemType } from '../../generated/prisma/enums';
import type { FeedItemDraft } from '../types/feed-item-draft.type';
import type { FeedItemGenerator } from '../types/feed-item-generator.type';
import type { MemberJoinedFeedInput } from '../types/member-joined-feed-input.type';

@Injectable()
export class MemberJoinedFeedItemGenerator implements FeedItemGenerator<MemberJoinedFeedInput> {
  generate(input: MemberJoinedFeedInput): FeedItemDraft {
    return {
      type: FeedItemType.MEMBER_JOINED,
      groupId: input.groupId,
      actorUserId: input.actorUserId,
      actorGroupMemberId: input.actorGroupMemberId,
      importanceScore: 35,
      occurredAt: input.occurredAt,
      metadata: {
        displayName: input.displayName,
      },
    };
  }
}
