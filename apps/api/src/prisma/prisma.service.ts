import 'dotenv/config';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { errorLogFields, structuredLog } from '../observability/structured-log';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({ connectionString });
    // pg emits idle-client errors (server-side disconnects, network drops) on the
    // pool. The adapter attaches a listener so the process survives them, but it
    // only reports at debug level; surface them so a dropped connection is visible.
    const adapter = new PrismaPg(pool, {
      onPoolError: (error) => {
        PrismaService.logger.error(
          structuredLog('prisma.pool_error', errorLogFields(error)),
        );
      },
    });

    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
