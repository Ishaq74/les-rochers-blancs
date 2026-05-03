import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://lesrochersblancs.fr',

  adapter: node({ mode: 'standalone' }),

  integrations: [
    icon({
      include: {
        mdi: ['*'],
        openmoji: ['*'],
        'circle-flags': ['*'],
      },
    }),
    sitemap({
      filter: (page) => !page.includes('/admin'),
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          en: 'en-US',
          ar: 'ar-SA',
          zh: 'zh-CN',
        },
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
    routing: 'manual',
  },

  // Image service (fix erreur /_image)
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },

  // Vite
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      noDiscovery: true,
    }
  },

  // Server
  server: {
    port: 4321,
    host: true
  },

  // Nettoyage
  telemetry: false,
  devToolbar: {
    enabled: false
  }
});