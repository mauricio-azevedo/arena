import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Resolved on read, not on import: only `migrate` and `db` commands touch the
    // datasource, so `prisma generate` — and anything that merely loads this file,
    // like knip — works with no DATABASE_URL. The commands that need it still fail
    // loudly, with Prisma's own message.
    get url() {
      return env('DATABASE_URL');
    },
  },
});
