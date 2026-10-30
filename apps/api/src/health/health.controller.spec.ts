import { HealthController } from './health.controller';
import type { ReadinessService } from './readiness.service';

describe('HealthController', () => {
  it('reports ok without any dependency', () => {
    const readiness = { check: jest.fn() };
    const controller = new HealthController(
      readiness as unknown as ReadinessService,
    );

    expect(controller.check()).toEqual({ status: 'ok' });
    expect(readiness.check).not.toHaveBeenCalled();
  });
});
