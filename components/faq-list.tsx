'use client';

import type { ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function FaqList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 w-full border-t border-border/60 pt-12 md:pt-16">
      <h2 className="mb-8 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <div className="divide-y divide-border border-y border-border">{children}</div>
    </section>
  );
}

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Collapsible>
      <h3>
        <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left text-base font-semibold text-foreground transition-colors hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green">
          {question}
          <CaretDownIcon
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            weight="bold"
            aria-hidden
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <p className="max-w-[65ch] pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default FaqList;
