import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ProcessingJob,
  ProcessingJobStatus,
} from './processing-job.types';

type GroupRankingProjection = {
  groupId: string;
  status: 'CURRENT' | 'PROCESSING' | 'FAILED';
  version: number;
  processingJobId: string | null;
  lastProcessedMatchId: string | null;
  lastProcessedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

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
    const projection = await this.findGroupRankingProjection(groupId);
    const activeStatuses: ProcessingJobStatus[] = ['PENDING', 'PROCESSING'];
    const activeJobs = jobs.filter((job) =>
      activeStatuses.includes(job.status),
    );

    return {
      isProcessing:
        projection?.status === 'PROCESSING' || activeJobs.length > 0,
      pendingCount: activeJobs.filter((job) => job.status === 'PENDING').length,
      processingCount: activeJobs.filter((job) => job.status === 'PROCESSING')
        .length,
      failedCount: jobs.filter((job) => job.status === 'FAILED').length,
      rankingProjection: projection,
      jobs,
    };
  }

  async retryFailedGroupJobs(groupId: string) {
    await this.ensureGroupExists(groupId);

    const result = await this.prisma.processingJob.updateMany({
      where: {
        groupId,
        status: 'FAILED',
      },
      data: {
        status: 'PENDING',
        availableAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });

    await this.prisma.$executeRaw`
      UPDATE "GroupRankingProjection"
      SET
        "status" = 'PROCESSING',
        "lastError" = NULL,
        "updatedAt" = NOW()
      WHERE "groupId" = ${groupId}
        AND "status" = 'FAILED'
    `;

    return { retriedCount: result.count };
  }

  private async findGroupRankingProjection(groupId: string) {
    const projections = await this.prisma.$queryRaw<GroupRankingProjection[]>`
      SELECT
        "groupId",
        "status",
        "version",
        "processingJobId",
        "lastProcessedMatchId",
        "lastProcessedAt",
        "lastError",
        "createdAt",
        "updatedAt"
      FROM "GroupRankingProjection"
      WHERE "groupId" = ${groupId}
      LIMIT 1
    `;

    return projections[0] ?? null;
  }

  private async ensureGroupExists(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }
  }
}
