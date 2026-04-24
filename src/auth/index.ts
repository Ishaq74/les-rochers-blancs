import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

const MIN_AUTH_SECRET_LENGTH = 32;
const ADMIN_PASSWORD_MIN_LENGTH = 12;

const baseURL = import.meta.env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;
if (!baseURL) throw new Error('BETTER_AUTH_URL environment variable is required');

let trustedBaseUrl: URL;

try {
  trustedBaseUrl = new URL(baseURL);
} catch {
  throw new Error('BETTER_AUTH_URL must be a valid absolute URL');
}

const authSecret = import.meta.env.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;
if (!authSecret) throw new Error('BETTER_AUTH_SECRET environment variable is required');
if (authSecret.length < MIN_AUTH_SECRET_LENGTH) {
  throw new Error(`BETTER_AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters`);
}

export const auth = betterAuth({
  baseURL: trustedBaseUrl.toString(),
  secret: authSecret,
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
    disableSignUp: true,
    minPasswordLength: ADMIN_PASSWORD_MIN_LENGTH,
    maxPasswordLength: 128,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [admin() as BetterAuthPlugin],
  trustedOrigins: [trustedBaseUrl.origin],
});
