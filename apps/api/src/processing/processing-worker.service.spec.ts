import { ProcessingWorkerService } from './processing-worker.service';
import type { ProcessingJobRunnerService } from './processing-job-runner.service';

describe('ProcessingWorkerService', () => {
  let resolveBatch: () => void;
  let runNextBatch: jest.Mock;
  let service: ProcessingWorkerService;

  beforeEach(() => {
    jest.useFakeTimers();
    runNextBatch = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveBatch = resolve;
        }),
    );
    service = new ProcessingWorkerService({
      runNextBatch,
    } as unknown as ProcessingJobRunnerService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs one batch at a time', () => {
    service.onModuleInit();
    jest.advanceTimersByTime(5000);

    expect(runNextBatch).toHaveBeenCalledTimes(1);
  });

  it('waits for the in-flight batch before destroying', async () => {
    service.onModuleInit();

    let destroyed = false;
    const destroy = service.onModuleDestroy().then(() => {
      destroyed = true;
    });
    await Promise.resolve();

    expect(destroyed).toBe(false);

    resolveBatch();
    await destroy;

    expect(destroyed).toBe(true);
    jest.advanceTimersByTime(5000);
    expect(runNextBatch).toHaveBeenCalledTimes(1);
  });
});
