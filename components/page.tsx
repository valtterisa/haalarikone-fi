import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export const PAGE_WIDTH = 'mx-auto w-full max-w-4xl px-4';

function PageRoot({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('w-full py-8 sm:py-16', className)} {...props}>
      {children}
    </div>
  );
}

function PageMissing({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <PageRoot className={cn('py-16 text-center', className)} {...props}>
      {children}
    </PageRoot>
  );
}

export const Page = Object.assign(PageRoot, {
  Missing: PageMissing,
});

export default Page;
