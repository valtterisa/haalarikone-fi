import { HubLink, type HubLinkProps } from '@/components/hub-link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

function HubGridRoot({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-border">{children}</div>;
}

function HubGridItem({ className, ...props }: HubLinkProps) {
  return (
    <HubLink
      {...props}
      className={cn(
        'flex min-h-11 items-center py-3 text-base font-medium text-foreground transition hover:text-green',
        className,
      )}
    />
  );
}

export const HubGrid = Object.assign(HubGridRoot, { Item: HubGridItem });
