'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { adminApproveClaimAction, adminRejectClaimAction } from '@/lib/org-profile-actions';

type ClaimItem = {
  id: string;
  orgSlug: string;
  orgName: string;
  claimEmail: string;
  proofMessage: string | null;
  createdAt: string;
};

export function AdminClaimsPanel({ claims }: { claims: ClaimItem[] }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (claims.length === 0) {
    return <p className="mt-3 text-sm text-foreground/60">{t('noPending')}</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {claims.map((claim) => (
        <li key={claim.id} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{claim.orgName}</p>
              <p className="text-sm text-foreground/65">{claim.claimEmail}</p>
              <p className="text-xs text-foreground/45">{claim.orgSlug}</p>
              {claim.proofMessage ? (
                <p className="mt-2 text-sm text-foreground/70">{claim.proofMessage}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                className="bg-green text-white hover:bg-green/90"
                onClick={() =>
                  startTransition(async () => {
                    await adminApproveClaimAction(claim.id);
                    router.refresh();
                  })
                }
              >
                {t('approve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await adminRejectClaimAction(claim.id);
                    router.refresh();
                  })
                }
              >
                {t('reject')}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
