import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/log-search/route';
import { clearSearchLog, flushSearchLog, stageSearchLog } from '@/lib/log-search-query';
import {
  deleteLogByQuery,
  ensureDb,
  findLogByQuery,
  hasTursoDb,
  wireFetchToLogSearchPost,
} from '@/lib/test/turso-search-log';

describe.skipIf(!hasTursoDb)('search logging pipeline → Turso', () => {
  const createdQueries: string[] = [];

  beforeEach(() => {
    clearSearchLog();
    ensureDb();
    wireFetchToLogSearchPost(POST);
  });

  afterEach(async () => {
    clearSearchLog();
    for (const query of createdQueries.splice(0)) {
      await deleteLogByQuery(query);
    }
    vi.unstubAllGlobals();
  });

  it('flush after stage inserts one Turso row', async () => {
    const query = `__vitest_pipeline_${randomUUID()}`;
    createdQueries.push(query);
    stageSearchLog({
      query,
      locale: 'fi',
      resultCount: 12,
      source: 'listing',
    });

    flushSearchLog();
    await vi.waitFor(async () => {
      expect(await findLogByQuery(query)).not.toBeNull();
    });

    expect(await findLogByQuery(query)).toMatchObject({
      query,
      locale: 'fi',
      resultCount: 12,
      source: 'listing',
      color: null,
    });
  });

  it('restaging before flush keeps a single final snapshot', async () => {
    const query = `__vitest_pipeline_${randomUUID()}`;
    createdQueries.push(query);
    stageSearchLog({
      query,
      locale: 'fi',
      resultCount: 12,
      source: 'listing',
    });
    stageSearchLog({
      query,
      locale: 'fi',
      resultCount: 3,
      source: 'listing',
      color: 'punainen',
    });

    flushSearchLog();
    await vi.waitFor(async () => {
      expect(await findLogByQuery(query)).not.toBeNull();
    });

    expect(await findLogByQuery(query)).toMatchObject({
      query,
      color: 'punainen',
      resultCount: 3,
      source: 'listing',
    });
  });
});
