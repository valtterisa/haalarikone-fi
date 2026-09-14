import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/log-search/route';
import {
  clearSearchLog,
  flushSearchLog,
  logSearchNow,
  stageSearchLog,
} from '@/lib/log-search-query';
import {
  ensureDb,
  findLogByQuery,
  hasTursoDb,
  wireFetchToLogSearchPost,
} from '@/lib/test/turso-search-log';

describe.skipIf(!hasTursoDb)('search logging pipeline → Turso', () => {
  beforeEach(() => {
    clearSearchLog();
    ensureDb();
    wireFetchToLogSearchPost(POST);
  });

  afterEach(() => {
    clearSearchLog();
    vi.unstubAllGlobals();
  });

  it('flush after stage inserts one Turso row', async () => {
    const query = `__vitest_pipeline_${randomUUID()}`;
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

  it('logSearchNow supersedes pending and inserts filter snapshot once', async () => {
    const query = `__vitest_pipeline_${randomUUID()}`;
    stageSearchLog({
      query,
      locale: 'fi',
      resultCount: 12,
      source: 'listing',
    });

    logSearchNow({
      query,
      locale: 'fi',
      resultCount: 3,
      source: 'listing',
      color: 'punainen',
    });

    await vi.waitFor(async () => {
      expect(await findLogByQuery(query)).not.toBeNull();
    });

    flushSearchLog();
    await Promise.resolve();

    expect(await findLogByQuery(query)).toMatchObject({
      query,
      color: 'punainen',
      resultCount: 3,
      source: 'listing',
    });
  });
});
