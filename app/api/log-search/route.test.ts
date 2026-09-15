import { beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
  valuesMock: vi.fn().mockResolvedValue(undefined),
  insertMock: vi.fn(),
  getDbMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getDb: () => hoisted.getDbMock(),
}));

import { POST } from './route';

describe('log-search API', () => {
  beforeEach(() => {
    hoisted.valuesMock.mockClear();
    hoisted.insertMock.mockClear();
    hoisted.getDbMock.mockReset();
    hoisted.insertMock.mockReturnValue({ values: hoisted.valuesMock });
    hoisted.getDbMock.mockReturnValue({ insert: hoisted.insertMock });
  });

  async function post(body: unknown) {
    const req = new Request('http://localhost/api/log-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    return { res, json: await res.json() };
  }

  it('inserts a valid text search snapshot', async () => {
    const { res, json } = await post({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 12,
      source: 'modal',
    });

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(hoisted.insertMock).toHaveBeenCalledOnce();
    expect(hoisted.valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'helsinki',
        locale: 'fi',
        resultCount: 12,
        source: 'modal',
        color: null,
        area: null,
        field: null,
        school: null,
        createdAt: expect.any(Number),
      }),
    );
  });

  it('inserts query plus advanced filters', async () => {
    await post({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 3,
      source: 'listing',
      color: 'punainen',
      area: 'Helsinki',
    });

    expect(hoisted.valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'helsinki',
        color: 'punainen',
        area: 'Helsinki',
        source: 'listing',
      }),
    );
  });

  it('returns ok without inserting invalid payloads', async () => {
    const { json } = await post({
      query: 'ab',
      locale: 'fi',
      resultCount: 0,
      source: 'listing',
    });

    expect(json).toEqual({ ok: true });
    expect(hoisted.insertMock).not.toHaveBeenCalled();
  });

  it('returns ok when db is unavailable', async () => {
    hoisted.getDbMock.mockReturnValue(null);

    const { json } = await post({
      query: 'helsinki',
      locale: 'fi',
      resultCount: 1,
      source: 'modal',
    });

    expect(json).toEqual({ ok: true });
    expect(hoisted.insertMock).not.toHaveBeenCalled();
  });

  it('returns ok on invalid json', async () => {
    const req = new Request('http://localhost/api/log-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    const res = await POST(req);
    expect(await res.json()).toEqual({ ok: true });
    expect(hoisted.insertMock).not.toHaveBeenCalled();
  });
});
