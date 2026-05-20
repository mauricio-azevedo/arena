import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedWriterService } from './feed-writer.service';
import { FeedOrchestratorService } from './feed-orchestrator.service';
import { GroupCreatedFeedItemGenerator } from './generators/group-created-feed-item.generator';
import { FeedController } from './feed.controller';
import { FeedReaderService } from './feed-reader.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FeedController],
  providers: [
    FeedWriterService,
    FeedReaderService,
    FeedOrchestratorService,
    GroupCreatedFeedItemGenerator,
  ],
  exports: [FeedOrchestratorService],
})
export class FeedModule {}
