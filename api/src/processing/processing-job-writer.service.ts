import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
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

  async enqueuePlatformTrendingPlayersRebuild(
    input: EnqueuePlatformTrendingPlayersRebuildInput = {},
    tx: PrismaClientLike = this.prisma,
  ) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const insertedJob = await this.insertPlatformTrendingPlayersRebuild(
        input,
        tx,
      );

      if (insertedJob) {
        this.logEnqueuedJob(insertedJob);
        return insertedJob;
      }

      const existingJob = await this.findLivePlatformTrendingPlayersRebuild(tx);

      if (existingJob) {
        this.logDedupedJob(existingJob);
        return existingJob;
      }
    }

    throw new Error('Unable to enqueue platform trending players rebuild job');
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

  private async insertPlatformTrendingPlayersRebuild(
    input: EnqueuePlatformTrendingPlayersRebuildInput,
    tx: PrismaClientLike,
  ) {
    const rows = await tx.$queryRaw<ProcessingJobLogFields[]>`
      INSERT INTO "ProcessingJob" (
        "id",
        "type",
        "scope",
        "status",
        "groupId",
        "matchId",
        "dedupeKey",
        "payload",
        "attemptCount",
        "maxAttempts",
        "availableAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        'PLATFORM_TRENDING_PLAYERS_REBUILD'::"ProcessingJobType",
        'PLATFORM'::"ProcessingJobScope",
        'PENDING'::"ProcessingJobStatus",
        NULL,
        NULL,
        ${PLATFORM_TRENDING_PLAYERS_DEDUPE_KEY},
        ${JSON.stringify(input.payload ?? {})}::jsonb,
        0,
        5,
        ${input.availableAt ?? new Date()},
        NOW(),
        NOW()
      )
      ON CONFLICT ("dedupeKey")
      WHERE "dedupeKey" IS NOT NULL
        AND "status" IN ('PENDING', 'PROCESSING')
      DO NOTHING
      RETURNING
        "id",
        "type"::text AS "type",
        "scope"::text AS "scope",
        "status"::text AS "status",
        "groupId",
        "matchId",
        "dedupeKey",
        "availableAt"
    `;

    return rows[0] ?? null;
  }

  private findLivePlatformTrendingPlayersRebuild(tx: PrismaClientLike) {
    return tx.processingJob.findFirst({
      where: {
        dedupeKey: PLATFORM_TRENDING_PLAYERS_DEDUPE_KEY,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private logDedupedJob(job: ProcessingJobLogFields) {
    this.logger.log(
      structuredLog('processing_job.deduped', {
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
