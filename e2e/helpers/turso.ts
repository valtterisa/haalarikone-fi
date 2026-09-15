import { createClient } from '@libsql/client/web';
import { expect } from '@playwright/test';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

export function hasTursoDb() {
  return Boolean(url && token);
}

function client() {
  if (!url || !token) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');
  return createClient({ url, authToken: token });
}

export async function waitForLogRow(query: string) {
  const db = client();
  let row: Record<string, unknown> | undefined;

  await expect
    .poll(
      async () => {
        const result = await db.execute({
          sql: 'SELECT query, source, locale, result_count FROM search_queries WHERE query = ? LIMIT 1',
          args: [query],
        });
        row = result.rows[0] as Record<string, unknown> | undefined;
        return row ?? null;
      },
      { timeout: 15_000 },
    )
    .not.toBeNull();

  return row!;
}
