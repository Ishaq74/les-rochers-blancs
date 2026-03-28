import { defineConfig, fontProviders } from 'astro/config';
import node from '@astrojs/node';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	adapter: node({ mode: 'standalone' }),
  integrations: [
    icon({
      include: {
        mdi: ['*'],
        openmoji: ['*'],
        'circle-flags': ['*'],
      },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
    },
    {
      provider: fontProviders.google(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
    },
    {
      provider: fontProviders.google(),
      name: 'Manrope',
      cssVariable: '--font-manrope',
    },
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'ar', 'zh'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
  server: { port: 4321 },
});
