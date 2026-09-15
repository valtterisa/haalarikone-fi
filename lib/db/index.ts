import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql/web';
import * as schema from './schema';

export function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return null;

  return drizzle({
    client: createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    schema,
  });
}

export function resetDb() {}
