import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { READINESS_TIMEOUT_MS, ReadinessService } from './readiness.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ReadinessResponse } from './types/readiness-response.type';

function buildService() {
  const prisma = { $queryRaw: jest.fn() };
  const service = new ReadinessService(prisma as unknown as PrismaService);
  const logged = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined);

  return { service, prisma, logged };
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
