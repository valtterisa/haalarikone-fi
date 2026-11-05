import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { magicLink } from 'better-auth/plugins';
import { requireDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendMagicLinkEmail } from '@/lib/email';
import { SITE_ORIGIN } from '@/lib/site-url';

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(requireDb(), {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    baseURL: process.env.BETTER_AUTH_URL ?? SITE_ORIGIN,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [SITE_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    emailAndPassword: {
      enabled: false,
    },
    plugins: [
      magicLink({
        expiresIn: 60 * 15,
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail({ email, url });
        },
      }),
    ],
  });
}

let _auth: ReturnType<typeof createAuth> | null = null;

function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

/** Lazy proxy so importing this module during build does not require Turso. */
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
