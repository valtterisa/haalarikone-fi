import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Next-style: `.env` then `.env.local` (local wins). Does not override existing process.env. */
export function loadProjectEnv(rootDir: string): Record<string, string> {
  const loaded: Record<string, string> = {};
  for (const name of ['.env', '.env.local']) {
    const path = resolve(rootDir, name);
    if (!existsSync(path)) continue;
    Object.assign(loaded, parseEnvFile(readFileSync(path, 'utf8')));
  }
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return { ...loaded, ...process.env } as Record<string, string>;
}
