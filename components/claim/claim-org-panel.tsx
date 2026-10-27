'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { claimOrganizationAction } from '@/lib/org-profile-actions';
import { authClient } from '@/lib/auth-client';
import { SpinnerGap } from '@phosphor-icons/react';

type ClaimOrgPanelProps = {
  orgSlug: string;
  orgName: string;
  verified: boolean;
  ownerUserId: string | null;
  emailHint: string | null;
  loginHref: string;
};

export function ClaimOrgPanel({
  orgSlug,
  orgName,
  verified,
  ownerUserId,
  emailHint,
  loginHref,
}: ClaimOrgPanelProps) {
  const t = useTranslations('claim');
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [localVerified, setLocalVerified] = useState(verified);
  const [localOwner, setLocalOwner] = useState(false);

  const isLoggedIn = Boolean(session?.user);
  const isOwner =
    localOwner || Boolean(ownerUserId && session?.user?.id && ownerUserId === session.user.id);

  if (sessionLoading) return null;

  // Public verified badge already lives next to the H1 — no second chip here.
  if (localVerified && !isOwner) return null;

  if (localVerified && isOwner) {
    return (
      <section className="mt-10 rounded-xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{t('verifiedOwner')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('ownerBody')}</p>
          </div>
          <Link
            href={{ pathname: '/oma/[slug]', params: { slug: orgSlug } }}
            className="flex-shrink-0 rounded-md bg-green px-4 py-2 text-sm font-medium text-white transition hover:bg-green/90"
          >
            {t('editProfile')}
          </Link>
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="mt-10 rounded-xl border border-border/60 bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {t('ctaTitle', { name: orgName })}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('ctaBody')}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {emailHint ? t('useOrgEmail', { hint: emailHint }) : t('manualHint')}
            </p>
          </div>
          <a
            href={loginHref}
            className="flex-shrink-0 rounded-md bg-green px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-green/90"
          >
            {t('signInToClaim')}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-xl border border-border/60 bg-card p-6 sm:p-8">
      {!open ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {t('ctaTitle', { name: orgName })}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('loggedInBody')}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-shrink-0 rounded-md bg-green px-4 py-2 text-sm font-medium text-white transition hover:bg-green/90"
          >
            {t('submitClaim')}
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
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
              if (result.status === 'approved') {
                setLocalVerified(true);
                setLocalOwner(true);
                setMessage(t('approved'));
              } else {
                setMessage(t('pending'));
                setOpen(false);
              }
            });
          }}
        >
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t('ctaTitle', { name: orgName })}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('loggedInBody')}</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground/80">{t('proofLabel')}</span>
            <textarea
              name="proofMessage"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              rows={3}
              placeholder={t('proofPlaceholder')}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-green/40"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center rounded-md bg-green px-4 py-2 text-sm font-medium text-white transition hover:bg-green/90 disabled:opacity-60"
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
      )}
    </section>
  );
}
