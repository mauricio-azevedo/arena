import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { structuredLog } from '../observability/structured-log';
import type { ProcessingJobType } from './processing-job.types';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type EnqueueJobInput = {
  type: ProcessingJobType;
  groupId: string;
  matchId?: string | null;
  payload?: Prisma.InputJsonValue;
  availableAt?: Date;
};

@Injectable()
export class ProcessingJobWriterService {
  private readonly logger = new Logger(ProcessingJobWriterService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enqueue(input: EnqueueJobInput, tx: PrismaClientLike = this.prisma) {
    const job = await tx.processingJob.create({
      data: {
        type: input.type,
        status: 'PENDING',
        groupId: input.groupId,
        matchId: input.matchId ?? null,
        payload: input.payload ?? {},
        availableAt: input.availableAt ?? new Date(),
      },
    });

    this.logger.log(
      structuredLog('processing_job.enqueued', {
        jobId: job.id,
        jobType: job.type,
        jobStatus: job.status,
        groupId: job.groupId,
        matchId: job.matchId,
        availableAt: job.availableAt.toISOString(),
      }),
    );

    return job;
  }
}
