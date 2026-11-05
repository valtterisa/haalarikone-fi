/// <reference path="./.cloudflare/types/index.d.ts" />

declare global {
  // Prefer `import { env } from "cloudflare:workers"` in app code.
  interface CloudflareEnv extends Env {}
}

export {};
