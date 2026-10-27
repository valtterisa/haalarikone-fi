import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSession } from '@/lib/auth-session';
import { ClaimOrgForm } from '@/components/claim/claim-org-form';
import { cn } from '@/lib/utils';

type ClaimOrgPanelProps = {
  orgSlug: string;
  orgName: string;
  verified: boolean;
  ownerUserId: string | null;
  emailHint: string | null;
  loginHref: string;
  className?: string;
};

export async function ClaimOrgPanel({
  orgSlug,
  orgName,
  verified,
  ownerUserId,
  emailHint,
  loginHref,
  className,
}: ClaimOrgPanelProps) {
  const t = await getTranslations('claim');
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const isOwner = Boolean(ownerUserId && userId && ownerUserId === userId);

  if (verified && !isOwner) return null;

  const shell = cn('border-t border-border px-5 py-4 sm:px-6', className);
  const actionClass =
    'shrink-0 rounded-md bg-green px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green/90';

  if (verified && isOwner) {
    return (
      <div className={shell}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('verifiedOwner')}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('ownerBody')}</p>
          </div>
          <Link
            href={{ pathname: '/oma/[slug]', params: { slug: orgSlug } }}
            className={actionClass}
          >
            {t('editProfile')}
          </Link>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={shell}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t('ctaTitle', { name: orgName })}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('ctaBody')} {emailHint ? t('useOrgEmail', { hint: emailHint }) : t('manualHint')}
            </p>
          </div>
          <a href={loginHref} className={cn(actionClass, 'text-center')}>
            {t('signInToClaim')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <ClaimOrgForm orgSlug={orgSlug} orgName={orgName} />
    </div>
  );
}
