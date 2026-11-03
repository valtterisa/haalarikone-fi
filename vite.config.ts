import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
    // Vite path: use the Vite plugin. Next `pnpm build` uses postcss.config.cjs.
    // Empty PostCSS plugins here so Vite does not also run @tailwindcss/postcss.
    tailwindcss(),
  ],
  css: {
    postcss: {
      plugins: [],
    },
  },
  optimizeDeps: {
    include: [
      'negotiator',
      '@formatjs/intl-localematcher',
      '@formatjs/fast-memoize',
      'intl-messageformat',
      'vinext > ipaddr.js',
    ],
  },
  legacy: {
    inconsistentCjsInterop: true,
  },
});
