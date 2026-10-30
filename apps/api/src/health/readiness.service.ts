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

class ReadinessTimeoutError extends Error {
  constructor() {
    super(`database check exceeded ${READINESS_TIMEOUT_MS}ms`);
    this.name = 'ReadinessTimeoutError';
  }
}

// Prisma surfaces `code` (`P1001`) on known request errors and `errorCode` on
// initialization errors; anything else degrades to the error name.
function databaseErrorCode(error: unknown): string {
  if (error instanceof ReadinessTimeoutError) {
    return 'TIMEOUT';
  }

  const candidate = error as Partial<
    Record<'code' | 'errorCode' | 'name', unknown>
  > | null;

  for (const field of ['code', 'errorCode', 'name'] as const) {
    const value = candidate?.[field];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return 'UNKNOWN';
}

@Injectable()
export class ReadinessService {
  private readonly logger = new Logger(ReadinessService.name);

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

    return {
      status: 'ok',
      checks: {
        database: { status: 'ok', latencyMs: Date.now() - startedAt },
      },
    };
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
