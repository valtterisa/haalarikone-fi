'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnvelopeSimple, SpinnerGap, CheckCircle } from '@phosphor-icons/react';

type MagicLinkFormProps = {
  callbackURL?: string;
  emailHint?: string | null;
};

export function MagicLinkForm({ callbackURL = '/oma', emailHint }: MagicLinkFormProps) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState(emailHint?.includes('@') ? emailHint : '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const { error: signError } = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL: '/kirjaudu?error=1',
      });
      if (signError) {
        setError(signError.message || t('sendError'));
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green/30 bg-green/5 px-5 py-6 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-green" weight="duotone" aria-hidden />
        <p className="mt-3 text-lg font-semibold tracking-tight text-foreground">
          {t('checkInbox')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          {t('checkInboxDetail', { email })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground/80">
          {t('emailLabel')}
        </label>
        <div className="relative">
          <EnvelopeSimple
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
            weight="regular"
            aria-hidden
          />
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={emailHint ?? t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-border/80 bg-background/80 pl-10 text-base shadow-sm"
          />
        </div>
        {emailHint ? <p className="text-xs text-foreground/55">{t('orgEmailHint')}</p> : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || !email.trim()}
        className="h-12 w-full rounded-xl bg-green text-base font-semibold text-white hover:bg-green/90"
      >
        {pending ? (
          <>
            <SpinnerGap className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {t('sending')}
          </>
        ) : (
          t('sendLink')
        )}
      </Button>
    </form>
  );
}
