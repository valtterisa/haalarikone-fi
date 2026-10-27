'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { UserCircle } from '@phosphor-icons/react';

export type HeaderAuthUser = {
  id: string;
  email: string;
};

type SignInControlProps = {
  user: HeaderAuthUser | null;
  className?: string;
  variant?: 'header' | 'menu';
  onNavigate?: () => void;
};

export function SignInControl({
  user,
  className,
  variant = 'header',
  onNavigate,
}: SignInControlProps) {
  const t = useTranslations('nav');
  const tDash = useTranslations('dashboard');

  if (user) {
    if (variant === 'menu') {
      return (
        <Link
          href="/oma"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-foreground transition hover:border-green/40',
            className,
          )}
        >
          <UserCircle className="h-6 w-6 text-green" weight="regular" aria-hidden />
          <span className="min-w-0">
            <span className="block text-base font-semibold tracking-tight">{tDash('title')}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
        </Link>
      );
    }

    return (
      <Link
        href="/oma"
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md bg-green px-3 text-[13px] font-semibold text-white transition hover:bg-green/90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2',
          className,
        )}
      >
        <UserCircle className="h-4 w-4" weight="bold" aria-hidden />
        {t('account')}
      </Link>
    );
  }

  if (variant === 'menu') {
    return (
      <Link
        href="/kirjaudu"
        onClick={onNavigate}
        className={cn(
          'flex h-12 items-center justify-center rounded-xl bg-green px-4 text-sm font-semibold text-white transition hover:bg-green/90',
          className,
        )}
      >
        {t('signIn')}
      </Link>
    );
  }

  return (
    <Link
      href="/kirjaudu"
      className={cn(
        'inline-flex h-9 items-center rounded-md bg-green px-3.5 text-[13px] font-semibold text-white transition hover:bg-green/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2',
        className,
      )}
    >
      {t('signIn')}
    </Link>
  );
}
