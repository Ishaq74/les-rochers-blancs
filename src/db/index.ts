import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL environment variable is required');

const parsedDatabaseUrl = new URL(connectionString);
const sslMode = parsedDatabaseUrl.searchParams.get('sslmode')?.toLowerCase();

function resolveSslMode(): false | 'require' {
  if (sslMode === 'disable') return false;
  if (sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full') {
    return 'require';
  }

  return (process.env.NODE_ENV === 'production' || import.meta.env.PROD) ? 'require' : false;
}

const client = postgres(connectionString, {
  ssl: resolveSslMode(),
  max: 10,
  idle_timeout: 30,
});

export const db = drizzle(client, { schema });
