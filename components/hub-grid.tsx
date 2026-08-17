import { HubLink, type HubLinkProps } from '@/components/hub-link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

function HubGridRoot({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2">{children}</div>;
}

function HubGridItem({ className, ...props }: HubLinkProps) {
  return (
    <HubLink
      {...props}
      className={cn(
        'inline-flex min-h-11 items-center rounded-lg border px-4 py-3 font-medium text-green hover:bg-green/5',
        className,
      )}
    />
  );
}

export const HubGrid = Object.assign(HubGridRoot, { Item: HubGridItem });
