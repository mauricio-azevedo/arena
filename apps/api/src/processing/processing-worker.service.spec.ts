import { ProcessingWorkerService } from './processing-worker.service';
import type { ProcessingJobRunnerService } from './processing-job-runner.service';
import type { ProcessingJobWriterService } from './processing-job-writer.service';

const ONE_HOUR_MS = 3_600_000;

function buildService() {
  const wakeListeners = new Set<() => void>();
  const runner = {
    runNextBatch: jest.fn().mockResolvedValue(0),
    getNextDueDelayMs: jest.fn().mockResolvedValue(null),
    stop: jest.fn(),
  };
  const writer = {
    onWake: (listener: () => void) => {
      wakeListeners.add(listener);

      return () => {
        wakeListeners.delete(listener);
      };
    },
  };
  const service = new ProcessingWorkerService(
    runner as unknown as ProcessingJobRunnerService,
    writer as unknown as ProcessingJobWriterService,
  );

  return {
    service,
    runner,
    wakeListeners,
    enqueue: () => wakeListeners.forEach((listener) => listener()),
  };
}

// Advances fake timers and lets the drain's promises settle.
function settle(ms = 0) {
  return jest.advanceTimersByTimeAsync(ms);
}

describe('ProcessingWorkerService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.PROCESSING_WORKER_DISABLED;
    delete process.env.PROCESSING_WORKER_SAFETY_POLL_MS;
  });

  it('drains on startup and stays silent while the queue is empty', async () => {
    const { service, runner } = buildService();

    service.onModuleInit();
    await settle();

    expect(runner.runNextBatch).toHaveBeenCalledTimes(1);
    expect(runner.getNextDueDelayMs).toHaveBeenCalledTimes(1);

    await settle(24 * ONE_HOUR_MS);

    expect(runner.runNextBatch).toHaveBeenCalledTimes(1);
  });

  it('claims until a pass comes back empty', async () => {
    const { service, runner } = buildService();
    runner.runNextBatch
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);

    service.onModuleInit();
    await settle();

    expect(runner.runNextBatch).toHaveBeenCalledTimes(3);
  });

  it('runs one extra pass for wakes that arrive mid-drain', async () => {
    const { service, runner, enqueue } = buildService();
    let finishFirstPass: (processedCount: number) => void = () => {};
    runner.runNextBatch.mockReturnValueOnce(
      new Promise<number>((resolve) => {
        finishFirstPass = resolve;
      }),
    );

    service.onModuleInit();
    await settle();

    enqueue();
    enqueue();
    expect(runner.runNextBatch).toHaveBeenCalledTimes(1);

    finishFirstPass(1);
    await settle();

    expect(runner.runNextBatch).toHaveBeenCalledTimes(3);
  });

  it('wakes on an enqueue once the queue has gone quiet', async () => {
    const { service, runner, enqueue } = buildService();

    service.onModuleInit();
    await settle();

    enqueue();
    await settle();

    expect(runner.runNextBatch).toHaveBeenCalledTimes(2);
  });

  it('comes back when a retry becomes due', async () => {
    const { service, runner } = buildService();
    runner.getNextDueDelayMs.mockResolvedValueOnce(10_000);

    service.onModuleInit();
    await settle();

    await settle(9_999);
    expect(runner.runNextBatch).toHaveBeenCalledTimes(1);

    await settle(1);
    expect(runner.runNextBatch).toHaveBeenCalledTimes(2);
  });

  it('retries the idle check when it fails, instead of waiting for a write', async () => {
    const { service, runner } = buildService();
    runner.getNextDueDelayMs.mockRejectedValueOnce(new Error('db is down'));

    service.onModuleInit();
    await settle();

    await settle(60_000);

    expect(runner.runNextBatch).toHaveBeenCalledTimes(2);
  });

  it('clamps a safety poll shorter than an hour', async () => {
    process.env.PROCESSING_WORKER_SAFETY_POLL_MS = '60000';
    const { service, runner } = buildService();

    service.onModuleInit();
    await settle();

    await settle(ONE_HOUR_MS - 1);
    expect(runner.runNextBatch).toHaveBeenCalledTimes(1);

    await settle(1);
    expect(runner.runNextBatch).toHaveBeenCalledTimes(2);
  });

  it('stops claiming and waits for the job in flight when destroyed', async () => {
    const { service, runner, wakeListeners } = buildService();
    let finishPass: (processedCount: number) => void = () => {};
    runner.runNextBatch.mockReturnValueOnce(
      new Promise<number>((resolve) => {
        finishPass = resolve;
      }),
    );

    service.onModuleInit();
    await settle();

    let destroyed = false;
    const destroy = service.onModuleDestroy().then(() => {
      destroyed = true;
    });
    await settle();

    expect(destroyed).toBe(false);
    expect(runner.stop).toHaveBeenCalledTimes(1);
    expect(wakeListeners.size).toBe(0);

    finishPass(1);
    await destroy;

    expect(destroyed).toBe(true);

    await settle(24 * ONE_HOUR_MS);
    expect(runner.runNextBatch).toHaveBeenCalledTimes(1);
  });

  it('does not touch the queue when disabled', async () => {
    process.env.PROCESSING_WORKER_DISABLED = 'true';
    const { service, runner, wakeListeners } = buildService();

    service.onModuleInit();
    await settle(24 * ONE_HOUR_MS);

    expect(wakeListeners.size).toBe(0);
    expect(runner.runNextBatch).not.toHaveBeenCalled();
  });
});
