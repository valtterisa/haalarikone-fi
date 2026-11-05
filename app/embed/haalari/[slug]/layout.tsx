import type { ReactNode } from 'react';

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-transparent p-0">{children}</div>;
}
