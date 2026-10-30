import { Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  READINESS_LOG_SAMPLE,
  READINESS_SLOW_MS,
  READINESS_TIMEOUT_MS,
  ReadinessService,
} from './readiness.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ReadinessResponse } from './types/readiness-response.type';

function buildService() {
  const prisma = { $queryRaw: jest.fn() };
  const service = new ReadinessService(prisma as unknown as PrismaService);
  const logged = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);
  const info = jest
    .spyOn(Logger.prototype, 'log')
    .mockImplementation(() => undefined);

  return { service, prisma, logged, info };
}

function loggedEvent(call: [unknown, ...unknown[]]): Record<string, unknown> {
  return JSON.parse(call[0] as string) as Record<string, unknown>;
}

// The 503 body is the report itself; Nest passes an object body through verbatim.
// Call this on the check's promise synchronously: a rejection that lands before
// a handler is attached fails the suite as unhandled.
function failureBody(
  check: Promise<ReadinessResponse>,
): Promise<ReadinessResponse> {
  return check.then(
    () => {
      throw new Error('expected the readiness check to fail');
    },
    (error: unknown) => {
      expect(error).toBeInstanceOf(ServiceUnavailableException);

      return (
        error as ServiceUnavailableException
      ).getResponse() as ReadinessResponse;
    },
  );
}

describe('ReadinessService.check', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports ok with the query latency', async () => {
    const { service, prisma, logged } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.checks.database.status).toBe('ok');
    expect(typeof report.checks.database.latencyMs).toBe('number');
    expect(report.checks.database.error).toBeUndefined();
    expect(logged).not.toHaveBeenCalled();
  });

  it('reports the Prisma error code and logs once when the query fails', async () => {
    const { service, prisma, logged } = buildService();
    prisma.$queryRaw.mockRejectedValue({ code: 'P1001' });

    const body = await failureBody(service.check());

    expect(body.status).toBe('error');
    expect(body.checks.database).toMatchObject({
      status: 'error',
      error: 'P1001',
    });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(logged.mock.calls[0][0]).toContain('health.readiness_failed');
  });

  // The body must stay free of the error message: it carries the database host.
  it('keeps the connection details out of the body', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockRejectedValue(
      Object.assign(
        new Error("Can't reach database server at `db.internal:5432`"),
        { code: 'P1001' },
      ),
    );

    const body = await failureBody(service.check());

    expect(JSON.stringify(body)).not.toContain('db.internal');
  });

  // The pg adapter reports an unreachable server as a failed raw query and puts
  // the real cause in the message, which the body must not carry.
  it('reports P1001 when the P2010 wrapper hides an unreachable server', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockRejectedValue(
      Object.assign(
        new Error(
          "Raw query failed. Code: `N/A`. Message: `Can't reach database server at `db.internal:5432``",
        ),
        { code: 'P2010' },
      ),
    );

    const body = await failureBody(service.check());

    expect(body.checks.database.error).toBe('P1001');
    expect(JSON.stringify(body)).not.toContain('db.internal');
  });

  it('keeps P2010 when the query failed for any other reason', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRaw.mockRejectedValue(
      Object.assign(new Error('Raw query failed. Message: `syntax error`'), {
        code: 'P2010',
      }),
    );

    const body = await failureBody(service.check());

    expect(body.checks.database.error).toBe('P2010');
  });

  it('reports TIMEOUT once the query outlives the budget', async () => {
    jest.useFakeTimers();

    try {
      const { service, prisma } = buildService();
      prisma.$queryRaw.mockReturnValue(new Promise(() => undefined));

      const settled = failureBody(service.check());
      await jest.advanceTimersByTimeAsync(READINESS_TIMEOUT_MS);
      const body = await settled;

      expect(body.checks.database).toMatchObject({
        status: 'error',
        error: 'TIMEOUT',
        latencyMs: READINESS_TIMEOUT_MS,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  // The latency of a healthy check is the cold-start signal, and no dashboard
  // can reconstruct it after the fact.
  it('logs a sampled success with the number of requests it stands for', async () => {
    const { service, prisma, info } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await service.check();

    expect(info).toHaveBeenCalledTimes(1);
    expect(loggedEvent(info.mock.calls[0])).toMatchObject({
      event: 'health.readiness_ok',
      dependency: 'database',
      sampleRate: READINESS_LOG_SAMPLE,
    });
  });

  it('logs one success per sample window, not every request', async () => {
    const { service, prisma, info } = buildService();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    for (let call = 0; call < READINESS_LOG_SAMPLE + 1; call += 1) {
      await service.check();
    }

    expect(info).toHaveBeenCalledTimes(2);
  });

  it('logs every slow success, sampling or not', async () => {
    jest.useFakeTimers();

    try {
      const { service, prisma, info } = buildService();
      prisma.$queryRaw.mockImplementation(() => {
        jest.advanceTimersByTime(READINESS_SLOW_MS);

        return Promise.resolve([{ '?column?': 1 }]);
      });

      // The first call claims the sample slot; the second would be skipped if
      // being slow did not override it.
      await service.check();
      await service.check();

      expect(info).toHaveBeenCalledTimes(2);
      expect(loggedEvent(info.mock.calls[1])).toMatchObject({
        latencyMs: READINESS_SLOW_MS,
        sampleRate: 1,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('leaves no pending timer behind on the happy path', async () => {
    jest.useFakeTimers();

    try {
      const { service, prisma } = buildService();
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      await service.check();

      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
