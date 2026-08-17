'use client';

import { Link } from '@/i18n/routing';
import { trackHubClick, type HubSource, type HubType } from '@/lib/analytics-events';
import type { InternalHref } from '@/lib/use-translated-routes';
import type { ReactNode } from 'react';

export type HubLinkProps = {
  href: InternalHref;
  source: HubSource;
  type: HubType;
  slug: string;
  className?: string;
  children: ReactNode;
};

export function HubLink({ href, source, type, slug, className, children }: HubLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackHubClick(source, type, slug);
      }}
    >
      {children}
    </Link>
  );
}
