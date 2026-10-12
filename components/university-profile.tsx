import { MapPin } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import type { ReactNode } from 'react';

export function UniversityProfile({ children }: { children: ReactNode }) {
  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
      {children}
    </section>
  );
}

export function UniversityProfileHeader({
  name,
  logoName,
  meta,
  children,
}: {
  name: string;
  logoName: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
          <Image
            className="object-contain p-2"
            src={`/logos/${logoName}.jpg`}
            fill
            sizes="56px"
            alt={`${name} logo`}
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {name}
          </h1>
          {meta ? <p className="mt-1 text-sm text-foreground/65">{meta}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function UniversityProfileMeta({
  count,
  countLabel,
  areas,
}: {
  count: number;
  countLabel: string;
  areas: string[];
}) {
  return (
    <>
      <span className="font-semibold tabular-nums text-foreground">{count}</span> {countLabel}
      {areas.length > 0 ? (
        <>
          <span className="mx-1.5 text-foreground/30" aria-hidden>
            /
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-green" weight="regular" aria-hidden />
            {areas.join(', ')}
          </span>
        </>
      ) : null}
    </>
  );
}

export function UniversityProfileBody({ children }: { children: ReactNode }) {
  return <div className="px-5 py-5 sm:px-6">{children}</div>;
}

export function UniversityProfileFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-border bg-muted/25 px-5 py-5 sm:px-6">{children}</div>;
}
