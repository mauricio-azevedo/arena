export type ReadinessStatus = 'ok' | 'error';

export type ReadinessResponse = {
  status: ReadinessStatus;
  checks: {
    database: {
      status: ReadinessStatus;
      latencyMs: number;
      // Prisma's error code (`P1001`), `TIMEOUT`, or the error name. Never the
      // message: it carries the database host.
      error?: string;
    };
  };
};
