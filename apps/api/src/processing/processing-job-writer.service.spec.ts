import { ProcessingJobWriterService } from './processing-job-writer.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';

const JOB = {
  id: 'job-1',
  type: 'GROUP_RANKING_REBUILD',
  scope: 'GROUP',
  status: 'PENDING',
  groupId: 'group-1',
  matchId: null,
  dedupeKey: null,
  availableAt: new Date(),
};

function buildService() {
  const prisma = {
    processingJob: { create: jest.fn().mockResolvedValue(JOB) },
  };
  const service = new ProcessingJobWriterService(
    prisma as unknown as PrismaService,
  );

  return { service, prisma };
}

describe('ProcessingJobWriterService.wake', () => {
  it('reaches subscribers until they unsubscribe', () => {
    const { service } = buildService();
    const listener = jest.fn();

    const unsubscribe = service.onWake(listener);
    service.wake();

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    service.wake();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  // The wake runs on a path whose write already committed; a subscriber that
  // throws must not turn that into a failed request.
  it('survives a subscriber that throws', () => {
    const { service } = buildService();
    service.onWake(() => {
      throw new Error('boom');
    });

    expect(() => service.wake()).not.toThrow();
  });
});

describe('ProcessingJobWriterService.enqueueGroupJob', () => {
  it('wakes the worker when it enqueues on its own connection', async () => {
    const { service } = buildService();
    const listener = jest.fn();
    service.onWake(listener);

    await service.enqueueGroupJob({
      type: 'GROUP_RANKING_REBUILD',
      groupId: 'group-1',
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  // Inside a transaction the claim cannot see the row yet: the call site owns
  // the wake, after its commit.
  it('does not wake from inside a transaction', async () => {
    const { service, prisma } = buildService();
    const listener = jest.fn();
    service.onWake(listener);

    const tx = {
      processingJob: { create: prisma.processingJob.create },
    } as unknown as Prisma.TransactionClient;

    await service.enqueueGroupJob(
      { type: 'GROUP_RANKING_REBUILD', groupId: 'group-1' },
      tx,
    );

    expect(listener).not.toHaveBeenCalled();
  });
});
