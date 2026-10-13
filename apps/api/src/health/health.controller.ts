import { Controller, Get } from '@nestjs/common';

// Liveness only: answers as soon as the HTTP server is up and deliberately does
// not touch the database. The platform health check polls this path continuously,
// so a database round-trip here would keep the compute awake and would restart a
// healthy process on a transient database outage that a restart cannot fix.
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
