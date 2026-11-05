'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { claimOrganizationAction } from '@/lib/org-profile-actions';
import { SpinnerGap } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type ClaimOrgFormProps = {
  orgSlug: string;
  orgName: string;
};

export function ClaimOrgForm({ orgSlug, orgName }: ClaimOrgFormProps) {
  const t = useTranslations('claim');
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<'approved' | 'pending' | null>(null);

  const actionClass =
    'shrink-0 rounded-md bg-green px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green/90 disabled:opacity-60';

  if (done === 'approved') {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{t('verifiedOwner')}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('ownerBody')}</p>
        </div>
        <Link href={{ pathname: '/oma/[slug]', params: { slug: orgSlug } }} className={actionClass}>
          {t('editProfile')}
        </Link>
      </div>
    );
  }

  if (done === 'pending') {
    return <p className="text-sm text-muted-foreground">{t('pending')}</p>;
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t('ctaTitle', { name: orgName })}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('loggedInBody')}</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={actionClass}>
          {t('submitClaim')}
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData();
        formData.set('orgSlug', orgSlug);
        formData.set('proofMessage', proof);
        startTransition(async () => {
          const result = await claimOrganizationAction(formData);
          if (!result.ok) {
            setMessage(t('error'));
            return;
          }
          setDone(result.status === 'approved' ? 'approved' : 'pending');
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{t('ctaTitle', { name: orgName })}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('loggedInBody')}</p>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-foreground/80">{t('proofLabel')}</span>
        <textarea
          name="proofMessage"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          rows={2}
          placeholder={t('proofPlaceholder')}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-green/40"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={cn(actionClass, 'inline-flex items-center')}
        >
          {pending ? (
            <>
              <SpinnerGap className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t('submitting')}
            </>
          ) : (
            t('submitClaim')
          )}
        </button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setOpen(false)}
        >
          {t('cancel')}
        </button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
