import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { InternalHref } from '@/lib/use-translated-routes';
import type { ReactNode } from 'react';

function NavigateCardRoot({
  href,
  className,
  children,
}: {
  href: InternalHref;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col justify-between rounded-xl bg-muted/50 p-5 transition-colors hover:bg-green/10 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green',
        className,
      )}
    >
      {children}
    </Link>
  );
}

function NavigateCardSwatches({ hexes }: { hexes: string[] }) {
  return (
    <div aria-hidden className="mb-4 flex h-10 overflow-hidden rounded-sm">
      {hexes.slice(0, 12).map((hex, i) => (
        <span key={`${hex}-${i}`} className="h-full min-w-0 flex-1" style={{ backgroundColor: hex }} />
      ))}
    </div>
  );
}

function NavigateCardBody({ children }: { children: ReactNode }) {
  return <div className="flex-1">{children}</div>;
}

export const NavigateCard = Object.assign(NavigateCardRoot, {
  Swatches: NavigateCardSwatches,
  Body: NavigateCardBody,
});
