import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

const baseURL = import.meta.env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;
if (!baseURL) throw new Error('BETTER_AUTH_URL environment variable is required');

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [admin() as BetterAuthPlugin],
  trustedOrigins: [baseURL],
});
