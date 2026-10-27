'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function sendMagicLinkAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const callbackURL = String(formData.get('callbackURL') ?? '/oma');
  const safeCallback = callbackURL.startsWith('/') ? callbackURL : '/oma';

  if (!email || !email.includes('@')) {
    return { ok: false, error: 'invalid_email' };
  }

  try {
    await auth.api.signInMagicLink({
      body: {
        email,
        callbackURL: safeCallback,
        newUserCallbackURL: safeCallback,
        errorCallbackURL: '/kirjaudu?error=1',
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'send_failed' };
  }
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect('/');
}
