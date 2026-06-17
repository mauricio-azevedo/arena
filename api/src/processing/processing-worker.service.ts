import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ProcessingJobRunnerService } from './processing-job-runner.service';

const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_BATCH_SIZE = 5;

@Injectable()
export class ProcessingWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessingWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly runner: ProcessingJobRunnerService) {}

  onModuleInit() {
    const shouldDisableWorker =
      process.env.PROCESSING_WORKER_DISABLED === 'true';

    if (shouldDisableWorker) {
      this.logger.warn(
        'Processing worker is disabled by PROCESSING_WORKER_DISABLED=true',
      );
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, this.getPollIntervalMs());
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      await this.runner.runNextBatch(this.getBatchSize());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown processing worker error';
      this.logger.error(message);
    } finally {
      this.isRunning = false;
    }
  }

  private getPollIntervalMs() {
    const value = Number(process.env.PROCESSING_WORKER_POLL_INTERVAL_MS);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_POLL_INTERVAL_MS;
  }

  private getBatchSize() {
    const value = Number(process.env.PROCESSING_WORKER_BATCH_SIZE);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_BATCH_SIZE;
  }
}
