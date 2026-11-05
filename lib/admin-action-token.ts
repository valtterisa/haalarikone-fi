import { createHmac, timingSafeEqual } from 'node:crypto';

type ActionPayload = {
  action: 'approve' | 'reject' | 'revoke';
  kind: 'claim';
  id: string;
  exp: number;
};

function secret(): string {
  const value = process.env.ADMIN_ACTION_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!value) {
    throw new Error('ADMIN_ACTION_SECRET or BETTER_AUTH_SECRET is required');
  }
  return value;
}

function encode(payload: ActionPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function sign(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url');
}

export function createAdminActionToken(
  payload: Omit<ActionPayload, 'exp'> & { expiresInSeconds?: number },
): string {
  const full: ActionPayload = {
    action: payload.action,
    kind: payload.kind,
    id: payload.id,
    exp: Math.floor(Date.now() / 1000) + (payload.expiresInSeconds ?? 60 * 60 * 24 * 7),
  };
  const body = encode(full);
  return `${body}.${sign(body)}`;
}

export function verifyAdminActionToken(token: string): ActionPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ActionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.kind !== 'claim') return null;
    if (!['approve', 'reject', 'revoke'].includes(payload.action)) return null;
    if (!payload.id) return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminActionUrl(token: string): string {
  const base =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haalarikone.fi';
  return `${base.replace(/\/$/, '')}/api/admin/discord-action?token=${encodeURIComponent(token)}`;
}
