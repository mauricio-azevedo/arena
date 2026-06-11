import { Controller, Get, Param, Post } from '@nestjs/common';
import { ProcessingJobReaderService } from './processing-job-reader.service';

@Controller('groups/:groupId/processing-jobs')
export class ProcessingController {
  constructor(private readonly reader: ProcessingJobReaderService) {}

  @Get()
  findGroupJobs(@Param('groupId') groupId: string) {
    return this.reader.getGroupProcessingSummary(groupId);
  }

  @Post('retry-failed')
  retryFailedGroupJobs(@Param('groupId') groupId: string) {
    return this.reader.retryFailedGroupJobs(groupId);
  }
}
