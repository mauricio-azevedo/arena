import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedModule } from '../feed/feed.module';
import { RankingModule } from '../ranking/ranking.module';
import { ProcessingController } from './processing.controller';
import { ProcessingJobReaderService } from './processing-job-reader.service';
import { ProcessingJobRunnerService } from './processing-job-runner.service';
import { ProcessingJobWriterService } from './processing-job-writer.service';
import { ProcessingWorkerService } from './processing-worker.service';

@Module({
  imports: [PrismaModule, FeedModule, RankingModule],
  controllers: [ProcessingController],
  providers: [
    ProcessingJobReaderService,
    ProcessingJobRunnerService,
    ProcessingJobWriterService,
    ProcessingWorkerService,
  ],
  exports: [ProcessingJobWriterService],
})
export class ProcessingModule {}
