import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedItemDraft } from './types/feed-item-draft.type';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class FeedWriterService {
  constructor(private readonly prisma: PrismaService) {}

  create(draft: FeedItemDraft, tx: PrismaClientLike = this.prisma) {
    return tx.feedItem.create({
      data: {
        type: draft.type,
        groupId: draft.groupId,
        actorUserId: draft.actorUserId ?? null,
        actorGroupMemberId: draft.actorGroupMemberId ?? null,
        matchId: draft.matchId ?? null,
        importanceScore: draft.importanceScore,
        metadata: draft.metadata,
        occurredAt: draft.occurredAt,
      },
    });
  }
}
