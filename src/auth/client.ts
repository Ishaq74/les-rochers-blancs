import { createAuthClient } from 'better-auth/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from '.';

export const authClient = createAuthClient({
  baseURL: '/api/auth',
  plugins: [inferAdditionalFields<typeof auth>()],
});
