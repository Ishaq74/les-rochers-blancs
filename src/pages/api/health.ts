import type { APIRoute } from 'astro';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ status: 'error', message: 'Database unreachable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
