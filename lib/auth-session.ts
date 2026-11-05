import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
