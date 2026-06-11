import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ProcessingJobType } from './processing-job.types';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type EnqueueJobInput = {
  type: ProcessingJobType;
  groupId: string;
  matchId?: string | null;
  payload?: Record<string, unknown>;
  availableAt?: Date;
};

@Injectable()
export class ProcessingJobWriterService {
  constructor(private readonly prisma: PrismaService) {}

  enqueue(input: EnqueueJobInput, tx: PrismaClientLike = this.prisma) {
    return tx.$executeRaw`
      INSERT INTO "ProcessingJob" (
        "id",
        "type",
        "status",
        "groupId",
        "matchId",
        "payload",
        "availableAt"
      ) VALUES (
        ${randomUUID()},
        ${input.type}::"ProcessingJobType",
        'PENDING'::"ProcessingJobStatus",
        ${input.groupId},
        ${input.matchId ?? null},
        ${JSON.stringify(input.payload ?? {})}::jsonb,
        ${input.availableAt ?? new Date()}
      )
    `;
  }
}
