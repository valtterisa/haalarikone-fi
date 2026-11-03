import { bindings, defineConfig, defineWorker } from 'cf/config';

/**
 * Cloudflare Worker config for vinext (`cf` + Vite plugin).
 * Secrets: `.dev.vars` locally, `cf workers secrets update` in production.
 */
export default defineConfig({
  worker: defineWorker({
    name: 'haalarikone-fi',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-03-30',
    compatibilityFlags: ['nodejs_compat'],
    observability: {
      enabled: true,
    },
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
    },
    env: {
      NEXT_PUBLIC_DATABUDDY_CLIENT_ID: bindings.text('Uu3N9TuBuUAa3wAS4pHNw'),
      DATABUDDY_WEBSITE_ID: bindings.text('Uu3N9TuBuUAa3wAS4pHNw'),
      ASSETS: bindings.assets(),
      EMAIL: bindings.sendEmail({
        allowedSenderAddresses: ['no-reply@haalarikone.fi'],
      }),
    },
  }),
});
