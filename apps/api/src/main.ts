import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3001';

  app.enableCors({
    origin: corsOrigin.split(','),
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
