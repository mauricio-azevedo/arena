import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GroupCreatedFeedItemGenerator } from './generators/group-created-feed-item.generator';
import { FeedWriterService } from './feed-writer.service';
import { GroupCreatedFeedInput } from './types/group-created-feed-input.type';
import { MemberJoinedFeedInput } from './types/member-joined-feed-input.type';
import { MemberJoinedFeedItemGenerator } from './generators/member-joined-feed-item.generator';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class FeedOrchestratorService {
  constructor(
    private readonly writer: FeedWriterService,
    private readonly groupCreatedGenerator: GroupCreatedFeedItemGenerator,
    private readonly memberJoinedGenerator: MemberJoinedFeedItemGenerator,
  ) {}

  createGroupCreatedItem(input: GroupCreatedFeedInput, tx?: PrismaClientLike) {
    const draft = this.groupCreatedGenerator.generate(input);

    return this.writer.create(draft, tx);
  }

  createMemberJoinedItem(input: MemberJoinedFeedInput, tx?: PrismaClientLike) {
    const draft = this.memberJoinedGenerator.generate(input);

    return this.writer.create(draft, tx);
  }
}
