import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProcessingJobReaderService } from './processing-job-reader.service';

@Controller('groups/:groupId/processing-jobs')
export class ProcessingController {
  constructor(private readonly reader: ProcessingJobReaderService) {}

  @Get()
  findGroupJobs(@Param('groupId') groupId: string) {
    return this.reader.getGroupProcessingSummary(groupId);
  }

  @Post('retry-failed')
  @UseGuards(JwtAuthGuard)
  retryFailedGroupJobs(@Param('groupId') groupId: string) {
    return this.reader.retryFailedGroupJobs(groupId);
  }
}
