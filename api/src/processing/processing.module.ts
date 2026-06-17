import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedModule } from '../feed/feed.module';
import { RankingModule } from '../ranking/ranking.module';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { PlatformTrendingModule } from '../platform-trending/platform-trending.module';
import { RatingProjectionService } from '../rating/rating-projection.service';
import { ProcessingController } from './processing.controller';
import { ProcessingJobReaderService } from './processing-job-reader.service';
import { ProcessingJobRunnerService } from './processing-job-runner.service';
import { ProcessingJobWriterService } from './processing-job-writer.service';
import { ProcessingWorkerService } from './processing-worker.service';
import { PlatformTrendingRebuildSchedulerService } from './platform-trending-rebuild-scheduler.service';

@Module({
  imports: [
    PrismaModule,
    FeedModule,
    RankingModule,
    AuthModule,
    GroupsModule,
    PlatformTrendingModule,
  ],
  controllers: [ProcessingController],
  providers: [
    RatingProjectionService,
    ProcessingJobReaderService,
    ProcessingJobRunnerService,
    ProcessingJobWriterService,
    ProcessingWorkerService,
    PlatformTrendingRebuildSchedulerService,
  ],
  exports: [ProcessingJobWriterService],
})
export class ProcessingModule {}
