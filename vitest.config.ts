import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import 'dotenv/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    server: {
      deps: {
        // So Vite resolves `next/navigation` via alias instead of Node ESM.
        inline: ['next-intl'],
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': rootDir,
      // next-intl imports `next/navigation` (no extension); Node ESM needs `.js`.
      'next/navigation': require.resolve('next/navigation.js'),
    },
  },
});
