import { HubLink, type HubLinkProps } from '@/components/hub-link';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const chipClassName =
  'inline-flex min-h-11 items-center rounded-lg border border-border/60 bg-white px-3.5 py-2 text-sm font-medium text-foreground transition hover:border-green/40 hover:bg-green/5 hover:text-green';

function PopularDestinationsRoot({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="w-full max-w-3xl mx-auto px-2 mb-6">
      <h2 className="text-base font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function PopularDestinationsGroup({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PopularDestinationsChip({ className, ...props }: HubLinkProps) {
  return <HubLink {...props} className={cn(chipClassName, className)} />;
}

export const PopularDestinations = Object.assign(PopularDestinationsRoot, {
  Group: PopularDestinationsGroup,
  Chip: PopularDestinationsChip,
});

export default PopularDestinations;
