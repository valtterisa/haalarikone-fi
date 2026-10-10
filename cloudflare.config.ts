import { bindings, defineConfig } from 'cf/config';

/**
 * Secret-like files were detected but not read or migrated: .dev.vars, .env, .env.example. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
  worker: {
    name: 'haalarikone-fi',
    compatibilityDate: '2026-03-30',
    compatibilityFlags: ['nodejs_compat'],
    entrypoint: '.open-next/worker.js',
    observability: {
      enabled: true,
    },
    assets: {
      runWorkerFirst: ['/llms.txt', '/llms-full.txt', '/*.txt', '/*.md', '/*.mdx'],
    },
    env: {
      NEXT_PUBLIC_DATABUDDY_CLIENT_ID: bindings.text('Uu3N9TuBuUAa3wAS4pHNw'),
      DATABUDDY_WEBSITE_ID: bindings.text('Uu3N9TuBuUAa3wAS4pHNw'),
      ASSETS: bindings.assets(),
    },
  },
});
