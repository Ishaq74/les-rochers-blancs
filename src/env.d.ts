/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly SITE_URL?: string;
  readonly HOST?: string;
  readonly PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: import('./auth').auth.$Infer.Session['user'] | null;
    session: import('./auth').auth.$Infer.Session['session'] | null;
  }
}
