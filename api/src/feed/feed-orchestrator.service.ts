import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { FeedItemType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { GroupCreatedFeedItemGenerator } from './generators/group-created-feed-item.generator';
import { FeedWriterService } from './feed-writer.service';
import { GroupCreatedFeedInput } from './types/group-created-feed-input.type';
import { MemberJoinedFeedInput } from './types/member-joined-feed-input.type';
import { MemberJoinedFeedItemGenerator } from './generators/member-joined-feed-item.generator';
import { MatchBlowoutFeedItemGenerator } from './generators/match-blowout-feed-item.generator';
import type { MatchBlowoutFeedInput } from './types/match-blowout-feed-input.type';
import { MatchCloseFeedItemGenerator } from './generators/match-close-feed-item.generator';
import type { MatchCloseFeedInput } from './types/match-close-feed-input.type';
import { RankingMovementFeedItemGenerator } from './generators/ranking-movement-feed-item.generator';
import type { FeedItemDraft } from './types/feed-item-draft.type';
import type { RankingMovementFeedInput } from './types/ranking-movement-feed-input.type';

const RANKING_MOVEMENT_FEED_ITEM_TYPE = 'RANKING_MOVEMENT' as FeedItemType;

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class FeedOrchestratorService {
  constructor(
    private readonly writer: FeedWriterService,
    private readonly groupCreatedGenerator: GroupCreatedFeedItemGenerator,
    private readonly memberJoinedGenerator: MemberJoinedFeedItemGenerator,
    private readonly matchBlowoutGenerator: MatchBlowoutFeedItemGenerator,
    private readonly matchCloseGenerator: MatchCloseFeedItemGenerator,
    private readonly rankingMovementGenerator: RankingMovementFeedItemGenerator,
  ) {}

  createGroupCreatedItem(input: GroupCreatedFeedInput, tx?: PrismaClientLike) {
    const draft = this.groupCreatedGenerator.generate(input);

    return this.writer.create(draft, tx);
  }

  createMemberJoinedItem(input: MemberJoinedFeedInput, tx?: PrismaClientLike) {
    const draft = this.memberJoinedGenerator.generate(input);

    return this.writer.create(draft, tx);
  }

  async syncMatchBlowoutItem(
    input: MatchBlowoutFeedInput,
    tx: PrismaClientLike,
  ) {
    const draft = this.matchBlowoutGenerator.generate(input);

    if (!draft) {
      await tx.feedItem.deleteMany({
        where: {
          type: FeedItemType.MATCH_BLOWOUT,
          matchId: input.matchId,
        },
      });
      return null;
    }

    return this.upsertGeneratedItem(draft, tx);
  }

  async syncMatchCloseItem(input: MatchCloseFeedInput, tx: PrismaClientLike) {
    const draft = this.matchCloseGenerator.generate(input);

    if (!draft) {
      await tx.feedItem.deleteMany({
        where: {
          type: FeedItemType.MATCH_CLOSE,
          matchId: input.matchId,
        },
      });
      return null;
    }

    return this.upsertGeneratedItem(draft, tx);
  }

  async syncGroupRankingMovementItems(
    groupId: string,
    inputs: RankingMovementFeedInput[],
    tx: PrismaClientLike,
  ) {
    const drafts = inputs
      .map((input) => this.rankingMovementGenerator.generate(input))
      .filter((draft): draft is FeedItemDraft => Boolean(draft));
    const matchIds = drafts
      .map((draft) => draft.matchId)
      .filter((matchId): matchId is string => Boolean(matchId));

    for (const draft of drafts) {
      await this.upsertGeneratedItem(draft, tx);
    }

    const deleteResult = await tx.feedItem.deleteMany({
      where: {
        type: RANKING_MOVEMENT_FEED_ITEM_TYPE,
        groupId,
        ...(matchIds.length > 0
          ? {
              matchId: {
                notIn: matchIds,
              },
            }
          : {}),
      },
    });

    return {
      upsertedCount: drafts.length,
      deletedCount: deleteResult.count,
      eligibleMatchCount: matchIds.length,
    };
  }

  private upsertGeneratedItem(draft: FeedItemDraft, tx: PrismaClientLike) {
    if (!draft.matchId) {
      throw new Error('Synchronized feed item requires matchId');
    }

    return tx.feedItem.upsert({
      where: {
        type_matchId: {
          type: draft.type,
          matchId: draft.matchId,
        },
      },
      create: {
        type: draft.type,
        scope: draft.scope,
        visibility: draft.visibility,
        groupId: draft.groupId ?? null,
        actorUserId: draft.actorUserId ?? null,
        actorGroupMemberId: draft.actorGroupMemberId ?? null,
        subjectUserId: draft.subjectUserId ?? null,
        matchId: draft.matchId ?? null,
        importanceScore: draft.importanceScore,
        metadata: draft.metadata,
        occurredAt: draft.occurredAt,
      },
      update: {
        scope: draft.scope,
        visibility: draft.visibility,
        groupId: draft.groupId ?? null,
        actorUserId: draft.actorUserId ?? null,
        actorGroupMemberId: draft.actorGroupMemberId ?? null,
        subjectUserId: draft.subjectUserId ?? null,
        importanceScore: draft.importanceScore,
        metadata: draft.metadata,
        occurredAt: draft.occurredAt,
      },
    });
  }
}
