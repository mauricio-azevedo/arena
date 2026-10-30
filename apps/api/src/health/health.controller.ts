import { Controller, Get } from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import type { ReadinessResponse } from './types/readiness-response.type';

@Controller('health')
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  // Liveness only: answers as soon as the HTTP server is up and deliberately does
  // not touch the database. The platform health check polls this path continuously,
  // so a database round-trip here would keep the compute awake and would restart a
  // healthy process on a transient database outage that a restart cannot fix.
  @Get()
  check() {
    return { status: 'ok' };
  }

  // Readiness: can this instance serve database-backed requests. For monitors and
  // humans, never for the platform health check.
  @Get('ready')
  ready(): Promise<ReadinessResponse> {
    return this.readiness.check();
  }
}
