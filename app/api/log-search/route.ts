import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { searchQueries } from '@/lib/db/schema';
import { emptyToNull, logSearchBodySchema } from '@/lib/log-search-schema';

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = logSearchBodySchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ ok: true });

    const db = getDb();
    if (!db) return NextResponse.json({ ok: true });

    const body = parsed.data;
    await db.insert(searchQueries).values({
      query: body.query,
      locale: body.locale,
      resultCount: body.resultCount,
      source: body.source,
      color: emptyToNull(body.color),
      area: emptyToNull(body.area),
      field: emptyToNull(body.field),
      school: emptyToNull(body.school),
      createdAt: Date.now(),
    });
  } catch {
  }

  return NextResponse.json({ ok: true });
}
