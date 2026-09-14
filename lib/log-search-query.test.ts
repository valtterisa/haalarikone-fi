import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSearchLog,
  flushSearchLog,
  logSearchNow,
  stageSearchLog,
} from '@/lib/log-search-query';

describe('log-search-query client helper', () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

  beforeEach(() => {
    clearSearchLog();
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    clearSearchLog();
    vi.unstubAllGlobals();
  });

  function lastBody() {
    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  }

  it('does not send on stage alone', () => {
    stageSearchLog({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 10,
      source: 'modal',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flushes the staged payload once', () => {
    stageSearchLog({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 10,
      source: 'modal',
    });
    flushSearchLog();
    flushSearchLog();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody()).toMatchObject({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 10,
      source: 'modal',
    });
  });

  it('overwrites pending while staging', () => {
    stageSearchLog({
      query: 'hel',
      locale: 'fi',
      resultCount: 0,
      source: 'modal',
    });
    stageSearchLog({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 8,
      source: 'modal',
    });
    flushSearchLog();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody().query).toBe('helsinki');
    expect(lastBody().resultCount).toBe(8);
  });

  it('logSearchNow supersedes pending text and sends the apply snapshot', () => {
    stageSearchLog({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 10,
      source: 'listing',
    });
    logSearchNow({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 3,
      source: 'listing',
      color: 'punainen',
    });
    flushSearchLog();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody()).toMatchObject({
      query: 'helsinki',
      color: 'punainen',
      resultCount: 3,
      source: 'listing',
    });
  });

  it('ignores payloads with no query and no filters', () => {
    stageSearchLog({
      query: 'ab',
      locale: 'fi',
      resultCount: 0,
      source: 'listing',
    });
    flushSearchLog();
    logSearchNow({
      query: '',
      locale: 'fi',
      resultCount: 0,
      source: 'listing',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clearSearchLog drops pending without sending', () => {
    stageSearchLog({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 2,
      source: 'modal',
    });
    clearSearchLog();
    flushSearchLog();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flush with keepalive uses fetch keepalive flag', () => {
    stageSearchLog({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 2,
      source: 'listing',
    });
    flushSearchLog(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ keepalive: true });
  });
});
