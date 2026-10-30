import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3001';

  app.enableCors({
    origin: corsOrigin.split(','),
  });

  // SIGTERM must reach onModuleDestroy: the processing worker stops claiming
  // and finishes the job in flight instead of leaving a locked row behind.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
