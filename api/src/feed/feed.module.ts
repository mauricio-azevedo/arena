import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedWriterService } from './feed-writer.service';
import { FeedOrchestratorService } from './feed-orchestrator.service';
import { GroupCreatedFeedItemGenerator } from './generators/group-created-feed-item.generator';
import { FeedController } from './feed.controller';
import { FeedReaderService } from './feed-reader.service';
import { AuthModule } from '../auth/auth.module';
import { MemberJoinedFeedItemGenerator } from './generators/member-joined-feed-item.generator';
import { MatchBlowoutFeedItemGenerator } from './generators/match-blowout-feed-item.generator';
import { MatchCloseFeedItemGenerator } from './generators/match-close-feed-item.generator';
import { FeedScoreService } from './feed-score.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FeedController],
  providers: [
    FeedWriterService,
    FeedReaderService,
    FeedOrchestratorService,
    GroupCreatedFeedItemGenerator,
    MemberJoinedFeedItemGenerator,
    MatchBlowoutFeedItemGenerator,
    MatchCloseFeedItemGenerator,
    FeedScoreService,
  ],
  exports: [FeedOrchestratorService],
})
export class FeedModule {}
