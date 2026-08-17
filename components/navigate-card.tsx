import { Link } from '@/i18n/routing';
import type { InternalHref } from '@/lib/use-translated-routes';
import type { ReactNode } from 'react';

function NavigateCardRoot({ href, children }: { href: InternalHref; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-all hover:border-green hover:bg-green/5 hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function NavigateCardIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
      {children}
    </div>
  );
}

function NavigateCardBody({ children }: { children: ReactNode }) {
  return <div className="flex-1">{children}</div>;
}

export const NavigateCard = Object.assign(NavigateCardRoot, {
  Icon: NavigateCardIcon,
  Body: NavigateCardBody,
});
