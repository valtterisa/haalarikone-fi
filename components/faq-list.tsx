import type { ReactNode } from 'react';

function FaqListRoot({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="w-full border-t border-border/60">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
          <div className="divide-y divide-border rounded-xl border border-border/60 bg-white">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group px-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center py-3 text-left text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        {question}
      </summary>
      <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </details>
  );
}

export const FaqList = Object.assign(FaqListRoot, { Item: FaqItem });

export default FaqList;
