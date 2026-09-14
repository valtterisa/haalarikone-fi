import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './lib/test/load-project-env';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const env = loadProjectEnv(rootDir);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    env,
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
});
