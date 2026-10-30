import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { errorLogFields, structuredLog } from '../observability/structured-log';
import { ProcessingJobRunnerService } from './processing-job-runner.service';
import { ProcessingJobWriterService } from './processing-job-writer.service';

const DEFAULT_BATCH_SIZE = 5;
const MIN_SAFETY_POLL_MS = 3_600_000;
const IDLE_CHECK_RETRY_MS = 60_000;

type WakeReason = 'enqueue' | 'startup' | 'timer' | 'safety_poll';

// The worker runs on wakes, not on a clock: an enqueue hands off after its
// commit, a one-shot timer covers retries and expired locks, and startup picks
// up whatever a crash or a deploy left behind. An idle queue means no DB
// traffic at all, which is what lets the database suspend between requests.
//
// Every wake is only a hint — the claim query decides. A missed hint delays a
// job, it never loses one.
@Injectable()
export class ProcessingWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessingWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private drain: Promise<void> | null = null;
  private pendingWake: WakeReason | null = null;
  private unsubscribe: (() => void) | null = null;
  private safetyPollMs: number | null = null;
  private stopped = false;

  constructor(
    private readonly runner: ProcessingJobRunnerService,
    private readonly writer: ProcessingJobWriterService,
  ) {}

  onModuleInit() {
    const shouldDisableWorker =
      process.env.PROCESSING_WORKER_DISABLED === 'true';

    if (shouldDisableWorker) {
      this.logger.warn(
        'Processing worker is disabled by PROCESSING_WORKER_DISABLED=true',
      );
      return;
    }

    this.safetyPollMs = this.resolveSafetyPollMs();
    this.unsubscribe = this.writer.onWake(() => this.wake('enqueue'));
    this.wake('startup');
  }

  // Stops claiming, then waits for the job already running: PrismaService is
  // destroyed right after this module and ends the pool, so a batch still in
  // flight would fail mid-cascade with "Cannot use a pool after calling end".
  async onModuleDestroy() {
    this.stopped = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.clearTimer();
    this.runner.stop();

    await this.drain;
  }

  private wake(reason: WakeReason) {
    if (this.stopped) {
      return;
    }

    this.clearTimer();

    // A drain is already running: it will do one more pass when it finishes,
    // however many wakes arrive meanwhile. Never two drains at once.
    if (this.drain) {
      this.pendingWake = reason;
      return;
    }

    this.logger.log(structuredLog('processing_worker.woken', { reason }));

    this.drain = this.runDrain().finally(() => {
      this.drain = null;

      // A wake that landed after the last pass decided to stop.
      const pendingWake = this.pendingWake;
      this.pendingWake = null;

      if (pendingWake) {
        this.wake(pendingWake);
      }
    });
  }

  private async runDrain() {
    do {
      this.pendingWake = null;

      await this.runPasses();

      if (this.stopped) {
        return;
      }

      await this.armIdleTimer();
    } while (this.pendingWake && !this.stopped);
  }

  // Claims until a pass comes back empty, so jobs enqueued mid-drain — by a
  // request or by another job — are picked up without waiting for a timer.
  private async runPasses() {
    try {
      let processedCount = 0;

      do {
        processedCount = await this.runner.runNextBatch(this.getBatchSize());
      } while (processedCount > 0 && !this.stopped);
    } catch (error) {
      this.logger.error(
        structuredLog('processing_worker.drain_failed', errorLogFields(error)),
      );
    }
  }

  private async armIdleTimer() {
    this.clearTimer();

    let nextDueDelayMs: number | null;

    try {
      nextDueDelayMs = await this.runner.getNextDueDelayMs();
    } catch (error) {
      // Without the next due time a queued retry would wait for the next
      // write; ask again shortly instead.
      this.logger.error(
        structuredLog('processing_worker.idle_check_failed', {
          retryInMs: IDLE_CHECK_RETRY_MS,
          ...errorLogFields(error),
        }),
      );
      this.setTimer(IDLE_CHECK_RETRY_MS, 'timer');
      return;
    }

    const safetyPollMs = this.safetyPollMs;

    this.logger.log(
      structuredLog('processing_worker.idle', {
        nextDueAt: this.toDueTimestamp(nextDueDelayMs),
        safetyPollAt: this.toDueTimestamp(safetyPollMs),
      }),
    );

    const delayMs = Math.min(
      nextDueDelayMs ?? Number.POSITIVE_INFINITY,
      safetyPollMs ?? Number.POSITIVE_INFINITY,
    );

    if (!Number.isFinite(delayMs)) {
      return;
    }

    this.setTimer(
      delayMs,
      delayMs === nextDueDelayMs ? 'timer' : 'safety_poll',
    );
  }

  private setTimer(delayMs: number, reason: WakeReason) {
    this.timer = setTimeout(() => {
      this.timer = null;
      this.wake(reason);
    }, delayMs);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private toDueTimestamp(delayMs: number | null) {
    return delayMs === null
      ? null
      : new Date(Date.now() + delayMs).toISOString();
  }

  // Off by default: every poll reactivates the database for its idle window,
  // which is exactly the cost this worker exists to avoid. It only buys
  // anything with more than one instance, where a write on one instance is
  // invisible to the others, so the floor is an hour.
  private resolveSafetyPollMs() {
    const value = Number(process.env.PROCESSING_WORKER_SAFETY_POLL_MS);

    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    if (value < MIN_SAFETY_POLL_MS) {
      this.logger.warn(
        structuredLog('processing_worker.safety_poll_clamped', {
          requestedMs: value,
          appliedMs: MIN_SAFETY_POLL_MS,
        }),
      );

      return MIN_SAFETY_POLL_MS;
    }

    return value;
  }

  private getBatchSize() {
    const value = Number(process.env.PROCESSING_WORKER_BATCH_SIZE);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_BATCH_SIZE;
  }
}
