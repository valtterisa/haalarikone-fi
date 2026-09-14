import { eq } from 'drizzle-orm';
import { vi } from 'vitest';
import { getDb, resetDb } from '@/lib/db';
import { searchQueries } from '@/lib/db/schema';

export const hasTursoDb = Boolean(process.env.TURSO_DATABASE_URL);

export function ensureDb() {
  resetDb();
  const db = getDb();
  if (!db) throw new Error('TURSO_DATABASE_URL required');
  return db;
}

export async function findLogByQuery(query: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(searchQueries).where(eq(searchQueries.query, query));
  return rows[0] ?? null;
}

export function wireFetchToLogSearchPost(post: (req: Request) => Promise<Response>) {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (!url.includes('/api/log-search')) {
      return new Response(null, { status: 404 });
    }
    return post(
      new Request('http://localhost/api/log-search', {
        method: 'POST',
        headers: init?.headers,
        body: init?.body,
      }),
    );
  });
}
