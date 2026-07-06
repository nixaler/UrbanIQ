import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Node.js runtime only — postgres-js opens a raw TCP socket, which the Edge
// Runtime does not support. Routes that need DB access must not set
// `export const runtime = 'edge'`. Edge-cached hydration (#29) is planned as
// a Phase 6 item using a fetch/HTTP-based driver instead of this client.
//
// Lazy on purpose: the nav bar (every page, including the built-in
// /_not-found page) transitively imports this module. If DATABASE_URL
// validation ran at import time, Next's build-time page-data collection
// would crash on routes that never actually touch the database. Matches
// the lazy-singleton pattern already used for the Stripe/AI/TTS clients.
let cachedDb: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (cachedDb) return cachedDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString, { prepare: false });
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
