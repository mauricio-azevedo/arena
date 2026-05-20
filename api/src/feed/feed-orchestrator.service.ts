import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GroupCreatedFeedItemGenerator } from './generators/group-created-feed-item.generator';
import { FeedWriterService } from './feed-writer.service';
import { GroupCreatedFeedInput } from './types/group-created-feed-input.type';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class FeedOrchestratorService {
  constructor(
    private readonly writer: FeedWriterService,
    private readonly groupCreatedGenerator: GroupCreatedFeedItemGenerator,
  ) {}

  createGroupCreatedItem(input: GroupCreatedFeedInput, tx?: PrismaClientLike) {
    const draft = this.groupCreatedGenerator.generate(input);

    return this.writer.create(draft, tx);
  }
}
