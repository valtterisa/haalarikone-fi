import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { insertSearchLog } from '@/lib/insert-search-log';
import { searchQueries } from '@/lib/db/schema';
import {
  deleteLogByQuery,
  ensureDb,
  findLogByQuery,
  hasTursoDb,
} from '@/lib/test/turso-search-log';

describe.skipIf(!hasTursoDb)('search logging → Turso', () => {
  const createdQueries: string[] = [];
  const createdSchools: string[] = [];

  beforeEach(() => {
    ensureDb();
  });

  afterEach(async () => {
    for (const query of createdQueries.splice(0)) {
      await deleteLogByQuery(query);
    }
    const db = ensureDb();
    for (const school of createdSchools.splice(0)) {
      await db.delete(searchQueries).where(eq(searchQueries.school, school));
    }
  });

  it('insertSearchLog writes one Turso row', async () => {
    const query = `__vitest_search_log_${randomUUID()}`;
    createdQueries.push(query);

    await insertSearchLog({
      query,
      locale: 'fi',
      resultCount: 3,
      source: 'listing',
      color: 'punainen',
    });

    await vi.waitFor(async () => {
      expect(await findLogByQuery(query)).not.toBeNull();
    });

    expect(await findLogByQuery(query)).toMatchObject({
      query,
      locale: 'fi',
      resultCount: 3,
      source: 'listing',
      color: 'punainen',
    });
  });

  it('insertSearchLog writes filter-only rows with empty query', async () => {
    const school = `__vitest_filter_${randomUUID()}`;
    createdSchools.push(school);

    await insertSearchLog({
      query: '',
      locale: 'fi',
      resultCount: 2,
      source: 'listing',
      school,
    });

    await vi.waitFor(async () => {
      const db = ensureDb();
      const rows = await db.select().from(searchQueries).where(eq(searchQueries.school, school));
      expect(rows[0] ?? null).toMatchObject({
        query: '',
        school,
        resultCount: 2,
        source: 'listing',
      });
    });
  });
});
