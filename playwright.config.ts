import { defineConfig, devices } from '@playwright/test';
import { loadProjectEnv } from './lib/test/load-project-env';

const rootDir = process.cwd();
const env = loadProjectEnv(rootDir);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      ...env,
    },
  },
});
