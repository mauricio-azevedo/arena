import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ProcessingJob, ProcessingJobStatus } from './processing-job.types';

@Injectable()
export class ProcessingJobReaderService {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupJobs(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.$queryRaw<ProcessingJob[]>`
      SELECT
        "id",
        "type",
        "status",
        "groupId",
        "matchId",
        "payload",
        "attemptCount",
        "maxAttempts",
        "availableAt",
        "lockedAt",
        "lockedBy",
        "lastError",
        "processedAt",
        "createdAt",
        "updatedAt"
      FROM "ProcessingJob"
      WHERE "groupId" = ${groupId}
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;
  }

  async getGroupProcessingSummary(groupId: string) {
    const jobs = await this.findGroupJobs(groupId);
    const activeStatuses: ProcessingJobStatus[] = ['PENDING', 'PROCESSING'];
    const activeJobs = jobs.filter((job) => activeStatuses.includes(job.status));

    return {
      isProcessing: activeJobs.length > 0,
      pendingCount: activeJobs.filter((job) => job.status === 'PENDING').length,
      processingCount: activeJobs.filter((job) => job.status === 'PROCESSING').length,
      failedCount: jobs.filter((job) => job.status === 'FAILED').length,
      jobs,
    };
  }
}
