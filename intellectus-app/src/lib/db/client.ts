import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Node.js runtime only — postgres-js opens a raw TCP socket, which the Edge
// Runtime does not support. Routes that need DB access must not set
// `export const runtime = 'edge'`. Edge-cached hydration (#29) is planned as
// a Phase 6 item using a fetch/HTTP-based driver instead of this client.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
