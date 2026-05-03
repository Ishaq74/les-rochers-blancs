import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL environment variable is required');

const parsedDatabaseUrl = new URL(connectionString);
const sslMode = parsedDatabaseUrl.searchParams.get('sslmode')?.toLowerCase();

function resolveSslMode() {
  // Désactive SSL dans Docker (le réseau interne n'utilise pas SSL)
  if (process.env.DATABASE_URL?.includes('@db:')) {
    return false;
  }
  // En vrai production (hors Docker) on peut garder SSL si besoin
  return process.env.NODE_ENV === 'production' ? 'require' : false;
}

const client = postgres(connectionString, {
  ssl: false,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
