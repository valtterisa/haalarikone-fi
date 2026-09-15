import { getDb } from '@/lib/db';
import { searchQueries } from '@/lib/db/schema';
import { emptyToNull } from '@/lib/log-search-schema';

export type SearchLogInsert = {
  query: string;
  locale: 'fi' | 'en' | 'sv';
  resultCount: number;
  source: 'modal' | 'listing';
  color?: string | null;
  area?: string | null;
  field?: string | null;
  school?: string | null;
};

function hasFilters(entry: SearchLogInsert) {
  return Boolean(entry.color || entry.area || entry.field || entry.school);
}

export async function insertSearchLog(entry: SearchLogInsert) {
  const db = getDb();
  if (!db) {
    console.error('search log skipped: TURSO_DATABASE_URL not set');
    return;
  }

  const query = entry.query.trim().slice(0, 200);
  if (query.length < 3 && !hasFilters(entry)) return;

  await db.insert(searchQueries).values({
    query,
    locale: entry.locale,
    resultCount: entry.resultCount,
    source: entry.source,
    color: emptyToNull(entry.color),
    area: emptyToNull(entry.area),
    field: emptyToNull(entry.field),
    school: emptyToNull(entry.school),
    createdAt: Date.now(),
  });
}
