import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Must be a direct/session-mode connection string, not a transaction-mode
    // pooled one — the matcher relies on `FOR UPDATE SKIP LOCKED` inside a
    // single multi-statement transaction, which PgBouncer transaction pooling
    // breaks.
    url: process.env.DATABASE_URL!,
  },
});
