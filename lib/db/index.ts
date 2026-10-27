import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql/web';
import * as schema from './schema';

export type AppDb = ReturnType<typeof createDb>;

function createDb(url: string, authToken: string | undefined) {
  return drizzle({
    client: createClient({
      url,
      authToken,
    }),
    schema,
  });
}

/** Best-effort DB for search logging — returns null if Turso is not configured. */
export function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;

  return createDb(url, process.env.TURSO_AUTH_TOKEN);
}

/** Hard-required DB for auth, claims, and profiles. */
export function requireDb(): AppDb {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error('TURSO_DATABASE_URL is required for authentication and org profiles');
  }

  return createDb(url, process.env.TURSO_AUTH_TOKEN);
}

export function resetDb() {}
