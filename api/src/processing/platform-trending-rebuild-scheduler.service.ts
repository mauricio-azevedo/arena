import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { structuredLog } from '../observability/structured-log';
import { ProcessingJobWriterService } from './processing-job-writer.service';

const DEFAULT_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_MIN_ENQUEUE_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PlatformTrendingRebuildSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    PlatformTrendingRebuildSchedulerService.name,
  );
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly processingJobs: ProcessingJobWriterService,
  ) {}

  onModuleInit() {
    const shouldDisableScheduler =
      process.env.PLATFORM_TRENDING_REBUILD_SCHEDULER_DISABLED === 'true';

    if (shouldDisableScheduler) {
      this.logger.warn(
        'Platform trending rebuild scheduler is disabled by PLATFORM_TRENDING_REBUILD_SCHEDULER_DISABLED=true',
      );
      return;
    }

    this.timer = setInterval(() => {
      void this.tick();
    }, this.getCheckIntervalMs());

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
      const minEnqueueIntervalMs = this.getMinEnqueueIntervalMs();

      const latestJob = await this.prisma.processingJob.findFirst({
        where: {
          type: 'PLATFORM_TRENDING_PLAYERS_REBUILD',
          scope: 'PLATFORM',
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          processedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (
        latestJob &&
        Date.now() - latestJob.createdAt.getTime() < minEnqueueIntervalMs
      ) {
        return;
      }

      const job =
        await this.processingJobs.enqueuePlatformTrendingPlayersRebuild({
          payload: {
            reason: 'SCHEDULED_PLATFORM_TRENDING_REBUILD',
            minEnqueueIntervalMs,
            latestJobId: latestJob?.id ?? null,
            latestJobStatus: latestJob?.status ?? null,
            latestJobCreatedAt: latestJob?.createdAt.toISOString() ?? null,
            latestJobProcessedAt: latestJob?.processedAt?.toISOString() ?? null,
          },
        });

      this.logger.log(
        structuredLog('platform_trending_rebuild_scheduler.job_ensured', {
          jobId: job.id,
          jobStatus: job.status,
          minEnqueueIntervalMs,
          latestJobId: latestJob?.id ?? null,
          latestJobStatus: latestJob?.status ?? null,
          latestJobCreatedAt: latestJob?.createdAt.toISOString() ?? null,
          latestJobProcessedAt: latestJob?.processedAt?.toISOString() ?? null,
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown platform trending rebuild scheduler error';

      this.logger.error(message);
    } finally {
      this.isRunning = false;
    }
  }

  private getCheckIntervalMs() {
    const value = Number(
      process.env.PLATFORM_TRENDING_REBUILD_CHECK_INTERVAL_MS,
    );

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_CHECK_INTERVAL_MS;
  }

  private getMinEnqueueIntervalMs() {
    const value = Number(
      process.env.PLATFORM_TRENDING_REBUILD_MIN_ENQUEUE_INTERVAL_MS,
    );

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_MIN_ENQUEUE_INTERVAL_MS;
  }
}
