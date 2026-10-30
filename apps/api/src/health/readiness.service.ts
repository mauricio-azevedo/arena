import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { errorLogFields, structuredLog } from '../observability/structured-log';
import type { ReadinessResponse } from './types/readiness-response.type';

// A Neon cold start costs hundreds of milliseconds and Prisma's own
// `connect_timeout` defaults to 5 s, so a query still pending here is an outage,
// not a slow start. The monitor's request timeout is 10 s, twice this.
export const READINESS_TIMEOUT_MS = 5000;

// A cold start costs hundreds of milliseconds, so anything past this second is
// the tail worth keeping whole. The body of the distribution only needs a
// sample, and sampling keeps a public route from flooding the log.
export const READINESS_SLOW_MS = 1000;
export const READINESS_LOG_SAMPLE = 10;

class ReadinessTimeoutError extends Error {
  constructor() {
    super(`database check exceeded ${READINESS_TIMEOUT_MS}ms`);
    this.name = 'ReadinessTimeoutError';
  }
}

// The pg driver adapter wraps an unreachable server as P2010 ("raw query
// failed") and leaves the real cause in the message. `SELECT 1` cannot fail for
// any other reason, so report Prisma's own code for a server it cannot reach
// rather than the wrapper. The message stays in the log: it carries the host.
const UNREACHABLE =
  /can't reach database server|connection refused|econnrefused/i;

// Prisma surfaces `code` (`P1001`) on known request errors and `errorCode` on
// initialization errors; anything else degrades to the error name.
function databaseErrorCode(error: unknown): string {
  if (error instanceof ReadinessTimeoutError) {
    return 'TIMEOUT';
  }

  const candidate = error as Partial<
    Record<'code' | 'errorCode' | 'name' | 'message', unknown>
  > | null;

  for (const field of ['code', 'errorCode', 'name'] as const) {
    const value = candidate?.[field];

    if (typeof value === 'string' && value.length > 0) {
      return value === 'P2010' && isUnreachable(candidate?.message)
        ? 'P1001'
        : value;
    }
  }

  return 'UNKNOWN';
}

function isUnreachable(message: unknown): boolean {
  return typeof message === 'string' && UNREACHABLE.test(message);
}

@Injectable()
export class ReadinessService {
  private readonly logger = new Logger(ReadinessService.name);
  private sampleSkips = 0;

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<ReadinessResponse> {
    const startedAt = Date.now();

    try {
      await this.queryWithTimeout();
    } catch (error) {
      const latencyMs = Date.now() - startedAt;

      this.logger.error(
        structuredLog('health.readiness_failed', {
          dependency: 'database',
          latencyMs,
          ...errorLogFields(error),
        }),
      );

      // Object bodies pass through verbatim, so a caller gets the same shape on
      // 503 as on 200 — minus the message, which the log keeps and the body
      // must not.
      throw new ServiceUnavailableException({
        status: 'error',
        checks: {
          database: {
            status: 'error',
            latencyMs,
            error: databaseErrorCode(error),
          },
        },
      } satisfies ReadinessResponse);
    }

    const latencyMs = Date.now() - startedAt;

    this.logSuccess(latencyMs);

    return {
      status: 'ok',
      checks: { database: { status: 'ok', latencyMs } },
    };
  }

  // The measured latency is the only record of how long the database takes to
  // answer when nothing is wrong, and it cannot be reconstructed afterwards.
  private logSuccess(latencyMs: number): void {
    const slow = latencyMs >= READINESS_SLOW_MS;

    // Never let sampling drop the slow tail: it is the cold-start signal.
    if (!slow && !this.claimSampleSlot()) {
      return;
    }

    this.logger.log(
      structuredLog('health.readiness_ok', {
        dependency: 'database',
        latencyMs,
        // How many requests this line stands for, so the distribution can be
        // rebuilt from a log search: slow checks are logged every time.
        sampleRate: slow ? 1 : READINESS_LOG_SAMPLE,
      }),
    );
  }

  private claimSampleSlot(): boolean {
    if (this.sampleSkips > 0) {
      this.sampleSkips -= 1;

      return false;
    }

    this.sampleSkips = READINESS_LOG_SAMPLE - 1;

    return true;
  }

  private async queryWithTimeout(): Promise<void> {
    let timer: NodeJS.Timeout | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () => reject(new ReadinessTimeoutError()),
            READINESS_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      // Whichever side loses the race leaves the timer pending; clearing it
      // keeps the event loop free of a handle per request.
      clearTimeout(timer);
    }
  }
}
