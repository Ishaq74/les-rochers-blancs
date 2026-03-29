import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL environment variable is required');

const client = postgres(connectionString, {
  ssl: (process.env.NODE_ENV === 'production' || import.meta.env.PROD) ? 'require' : false,
});

export const db = drizzle(client, { schema });
