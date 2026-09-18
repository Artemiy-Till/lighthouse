import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Client generation and CI validation do not connect to PostgreSQL.
    // Runtime and migration commands still receive the real URL via Vercel/.env.
    url:
      process.env.DATABASE_URL ??
      'postgresql://marketplace:marketplace@localhost:5432/marketplace',
  },
});
