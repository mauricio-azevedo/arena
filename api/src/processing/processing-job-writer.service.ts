import { Injectable } from '@nestjs/common';
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
    return tx.processingJob.create({
      data: {
        type: input.type,
        status: 'PENDING',
        groupId: input.groupId,
        matchId: input.matchId ?? null,
        payload: input.payload ?? {},
        availableAt: input.availableAt ?? new Date(),
      },
    });
  }
}
