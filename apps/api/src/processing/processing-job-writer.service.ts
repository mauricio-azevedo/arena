import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { structuredLog } from '../observability/structured-log';
import type { ProcessingJobType } from './processing-job.types';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type EnqueueGroupJobInput = {
  type: ProcessingJobType;
  groupId: string;
  matchId?: string | null;
  payload?: Prisma.InputJsonValue;
  availableAt?: Date;
};

type ProcessingJobLogFields = {
  id: string;
  type: string;
  scope: string;
  status: string;
  groupId: string | null;
  matchId: string | null;
  dedupeKey: string | null;
  availableAt: Date;
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

  private logEnqueuedJob(job: ProcessingJobLogFields) {
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
