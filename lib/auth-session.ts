import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (!isAdminEmail(session.user.email)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
