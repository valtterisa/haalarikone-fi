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

function buildLogClauses(args: {
  query?: string;
  color?: string | null;
  source?: string;
  sinceMs?: number;
}) {
  const clauses = ['created_at >= ?'];
  const params: Array<string | number> = [args.sinceMs ?? 0];
  if (args.query !== undefined) {
    clauses.push('query = ?');
    params.push(args.query);
  }
  if (args.color === null) {
    clauses.push('color IS NULL');
  } else if (args.color !== undefined) {
    clauses.push('color = ?');
    params.push(args.color);
  }
  if (args.source !== undefined) {
    clauses.push('source = ?');
    params.push(args.source);
  }
  return { clauses, params };
}

export async function countLogRows(args: {
  query?: string;
  color?: string | null;
  source?: string;
  sinceMs?: number;
}) {
  const db = client();
  const { clauses, params } = buildLogClauses(args);
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM search_queries WHERE ${clauses.join(' AND ')}`,
    args: params,
  });
  return Number(result.rows[0]?.count ?? 0);
}

export async function waitForLogRow(args: {
  query?: string;
  color?: string | null;
  source?: string;
  sinceMs?: number;
}) {
  const db = client();
  let row: Record<string, unknown> | undefined;
  const { clauses, params } = buildLogClauses(args);

  await expect
    .poll(
      async () => {
        const result = await db.execute({
          sql: `SELECT query, source, locale, result_count, color FROM search_queries WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC LIMIT 1`,
          args: params,
        });
        row = result.rows[0] as Record<string, unknown> | undefined;
        return row ?? null;
      },
      { timeout: 15_000 },
    )
    .not.toBeNull();

  return row!;
}
