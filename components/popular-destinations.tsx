import { HubLink, type HubLinkProps } from '@/components/hub-link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

function PopularDestinationsRoot({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto -mt-2 mb-6 w-full max-w-4xl px-4 sm:-mt-4 sm:mb-8 sm:px-2">
      <h2 className="sr-only">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function PopularDestinationsGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-5">
      <p className="shrink-0 pt-2 text-sm text-muted-foreground sm:w-28 sm:pt-0">{label}</p>
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PopularDestinationsChip({ className, ...props }: HubLinkProps) {
  return (
    <HubLink
      {...props}
      className={cn(
        'inline-flex min-h-11 items-center rounded-lg bg-muted px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-green/10 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green',
        className,
      )}
    />
  );
}

export const PopularDestinations = Object.assign(PopularDestinationsRoot, {
  Group: PopularDestinationsGroup,
  Chip: PopularDestinationsChip,
});

export default PopularDestinations;
