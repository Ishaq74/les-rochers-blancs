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

declare module 'astro-icon/components' {
  export const Icon: (props: {
    name: string;
    class?: string;
    className?: string;
    [key: string]: unknown;
  }) => unknown;
}

declare module '@/components/starwind/carousel' {
  export const Carousel: (props: {
    class?: string;
    className?: string;
    [key: string]: unknown;
  }) => unknown;
  export const CarouselContent: (props: Record<string, unknown>) => unknown;
  export const CarouselItem: (props: Record<string, unknown>) => unknown;
  export const CarouselNext: (props: Record<string, unknown>) => unknown;
  export const CarouselPrevious: (props: Record<string, unknown>) => unknown;
}

declare module '@/components/starwind/tabs' {
  export const Tabs: (props: {
    class?: string;
    className?: string;
    [key: string]: unknown;
  }) => unknown;
  export const TabsList: (props: Record<string, unknown>) => unknown;
  export const TabsTrigger: (props: Record<string, unknown>) => unknown;
  export const TabsContent: (props: Record<string, unknown>) => unknown;
}

declare module '@iconify/utils' {
  export const getIconData: (...args: unknown[]) => unknown;
  export const iconToSVG: (...args: unknown[]) => {
    attributes: Record<string, unknown>;
    body: string;
  };
}

declare module '@iconify/utils/lib/svg/build.js' {
  export interface IconifyIconBuildResult {
    attributes: Record<string, unknown>;
  }
}
