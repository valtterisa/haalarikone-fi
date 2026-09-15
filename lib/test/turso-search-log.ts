import { eq } from 'drizzle-orm';
import { getDb, resetDb } from '@/lib/db';
import { searchQueries } from '@/lib/db/schema';

export const hasTursoDb = Boolean(
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN,
);

export function ensureDb() {
  resetDb();
  const db = getDb();
  if (!db) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');
  return db;
}

export async function findLogByQuery(query: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(searchQueries).where(eq(searchQueries.query, query));
  return rows[0] ?? null;
}

export async function deleteLogByQuery(query: string) {
  const db = getDb();
  if (!db) return;
  await db.delete(searchQueries).where(eq(searchQueries.query, query));
}
