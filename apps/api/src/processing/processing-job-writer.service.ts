import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { errorLogFields, structuredLog } from '../observability/structured-log';
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
  private readonly wakeSignal = new EventEmitter();

  constructor(private readonly prisma: PrismaService) {}

  // Tells the worker the queue may have work, in-process and fire-and-forget:
  // the table stays the source of truth and every wake is verified by the
  // claim query, so a missed wake delays a job, it never loses one.
  //
  // Write paths enqueue inside their transaction — where the claim cannot see
  // the row yet — and call this after it commits.
  wake() {
    try {
      this.wakeSignal.emit('wake');
    } catch (error) {
      // A wake must never fail the write that already committed.
      this.logger.error(
        structuredLog('processing_job.wake_failed', errorLogFields(error)),
      );
    }
  }

  onWake(listener: () => void) {
    this.wakeSignal.on('wake', listener);

    return () => {
      this.wakeSignal.off('wake', listener);
    };
  }

  async enqueueGroupJob(
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

    // Autocommit: the row is already visible, so there is no commit for the
    // call site to wake after.
    if (tx === this.prisma) {
      this.wake();
    }

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
