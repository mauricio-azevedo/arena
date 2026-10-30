import { ProcessingJobRunnerService } from './processing-job-runner.service';
import type { PrismaService } from '../prisma/prisma.service';

type PrismaMock = {
  processingJob: { updateMany: jest.Mock };
  $queryRaw: jest.Mock;
};

function buildService() {
  const prisma: PrismaMock = {
    processingJob: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  // The projection collaborators only matter once a job is claimed; these
  // tests stop at the claim.
  const unused = undefined as never;
  const service = new ProcessingJobRunnerService(
    prisma as unknown as PrismaService,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
    unused,
  );

  return { service, prisma };
}

describe('ProcessingJobRunnerService.runNextBatch', () => {
  it('reports nothing processed when the queue is empty', async () => {
    const { service, prisma } = buildService();

    await expect(service.runNextBatch(5)).resolves.toBe(0);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('claims nothing after stop()', async () => {
    const { service, prisma } = buildService();

    service.stop();

    await expect(service.runNextBatch(5)).resolves.toBe(0);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});

// The delay is the worker's only hint about retries and expired locks, so the
// clamp matters: no floor and a due row spins the drain; no cap and a timer
// outlives the process it was armed in.
describe('ProcessingJobRunnerService.getNextDueDelayMs', () => {
  it('returns null when nothing is queued', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ delayMs: null }]);

    await expect(service.getNextDueDelayMs()).resolves.toBeNull();
  });

  it('passes a due time through', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ delayMs: 10_000 }]);

    await expect(service.getNextDueDelayMs()).resolves.toBe(10_000);
  });

  it('floors an overdue row at 250 ms', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ delayMs: -5_000 }]);

    await expect(service.getNextDueDelayMs()).resolves.toBe(250);
  });

  it('caps a far-off row at 60 min', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ delayMs: 86_400_000 }]);

    await expect(service.getNextDueDelayMs()).resolves.toBe(3_600_000);
  });
});
