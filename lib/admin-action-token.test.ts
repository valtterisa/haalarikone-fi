import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  adminActionUrl,
  createAdminActionToken,
  verifyAdminActionToken,
} from '@/lib/admin-action-token';

describe('admin action tokens', () => {
  const prevAdmin = process.env.ADMIN_ACTION_SECRET;
  const prevAuth = process.env.BETTER_AUTH_SECRET;
  const prevUrl = process.env.BETTER_AUTH_URL;

  beforeEach(() => {
    process.env.ADMIN_ACTION_SECRET = 'test-admin-secret';
    process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret';
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env.ADMIN_ACTION_SECRET = prevAdmin;
    process.env.BETTER_AUTH_SECRET = prevAuth;
    process.env.BETTER_AUTH_URL = prevUrl;
  });

  it('round-trips approve/reject/revoke payloads', () => {
    for (const action of ['approve', 'reject', 'revoke'] as const) {
      const token = createAdminActionToken({ action, kind: 'claim', id: 'claim-1' });
      expect(verifyAdminActionToken(token)).toMatchObject({
        action,
        kind: 'claim',
        id: 'claim-1',
      });
    }
  });

  it('rejects tampered or expired tokens', () => {
    const token = createAdminActionToken({ action: 'approve', kind: 'claim', id: 'claim-1' });
    expect(verifyAdminActionToken(`${token}x`)).toBeNull();
    expect(verifyAdminActionToken('not.a.token')).toBeNull();

    const expired = createAdminActionToken({
      action: 'approve',
      kind: 'claim',
      id: 'claim-1',
      expiresInSeconds: -10,
    });
    expect(verifyAdminActionToken(expired)).toBeNull();
  });

  it('builds discord action URLs against BETTER_AUTH_URL', () => {
    const token = createAdminActionToken({ action: 'approve', kind: 'claim', id: 'abc' });
    expect(adminActionUrl(token)).toBe(
      `http://localhost:3000/api/admin/discord-action?token=${encodeURIComponent(token)}`,
    );
  });
});
