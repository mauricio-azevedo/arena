import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok without any dependency', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
