import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { structuredLog } from '../observability/structured-log';
import type { ProcessingJobType } from './processing-job.types';

const PLATFORM_TRENDING_PLAYERS_DEDUPE_KEY =
  'platform:trending-players:rebuild';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type EnqueueGroupJobInput = {
  type: Exclude<ProcessingJobType, 'PLATFORM_TRENDING_PLAYERS_REBUILD'>;
  groupId: string;
  matchId?: string | null;
  payload?: Prisma.InputJsonValue;
  availableAt?: Date;
};

type EnqueuePlatformTrendingPlayersRebuildInput = {
  payload?: Prisma.InputJsonValue;
  availableAt?: Date;
};

@Injectable()
export class ProcessingJobWriterService {
  private readonly logger = new Logger(ProcessingJobWriterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enqueueGroupJob(
    input: EnqueueGroupJobInput,
    tx: PrismaClientLike = this.prisma,
  ) {
    return this.enqueueGroup(input, tx);
  }

  async enqueue(
    input: EnqueueGroupJobInput,
    tx: PrismaClientLike = this.prisma,
  ) {
    return this.enqueueGroup(input, tx);
  }

  async enqueuePlatformTrendingPlayersRebuild(
    input: EnqueuePlatformTrendingPlayersRebuildInput = {},
    tx: PrismaClientLike = this.prisma,
  ) {
    const job = await tx.processingJob.create({
      data: {
        type: 'PLATFORM_TRENDING_PLAYERS_REBUILD',
        scope: 'PLATFORM',
        status: 'PENDING',
        groupId: null,
        matchId: null,
        dedupeKey: PLATFORM_TRENDING_PLAYERS_DEDUPE_KEY,
        payload: input.payload ?? {},
        availableAt: input.availableAt ?? new Date(),
      },
    });

    this.logEnqueuedJob(job);

    return job;
  }

  private async enqueueGroup(
    input: EnqueueGroupJobInput,
    tx: PrismaClientLike = this.prisma,
  ) {
    const job = await tx.processingJob.create({
      data: {
        type: input.type,
        scope: 'GROUP',
        status: 'PENDING',
        groupId: input.groupId,
        matchId: input.matchId ?? null,
        payload: input.payload ?? {},
        availableAt: input.availableAt ?? new Date(),
      },
    });

    this.logEnqueuedJob(job);

    return job;
  }

  private logEnqueuedJob(job: {
    id: string;
    type: ProcessingJobType;
    scope: 'GROUP' | 'PLATFORM';
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    groupId: string | null;
    matchId: string | null;
    dedupeKey: string | null;
    availableAt: Date;
  }) {
    this.logger.log(
      structuredLog('processing_job.enqueued', {
        jobId: job.id,
        jobType: job.type,
        jobScope: job.scope,
        jobStatus: job.status,
        groupId: job.groupId,
        matchId: job.matchId,
        dedupeKey: job.dedupeKey,
        availableAt: job.availableAt.toISOString(),
      }),
    );
  }
}
