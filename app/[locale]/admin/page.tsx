import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Page } from '@/components/page';
import { getSession, isAdminEmail } from '@/lib/auth-session';
import { listPendingClaims } from '@/lib/org-profile';
import { loadUniversities } from '@/lib/load-universities';
import { AdminClaimsPanel } from '@/components/admin/admin-claims-panel';
import { AdminInviteForm } from '@/components/admin/admin-invite-form';
import type { Locale } from '@/lib/slug-translations';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: `${t('title')} | Haalarikone`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect('/kirjaudu?next=/admin');
  }
  if (!isAdminEmail(session.user.email)) {
    redirect('/');
  }

  const t = await getTranslations({ locale, namespace: 'admin' });
  const [pending, universities] = await Promise.all([listPendingClaims(), loadUniversities('fi')]);
  const nameBySlug = new Map(universities.map((u) => [u.slug, u.ainejarjesto ?? u.slug] as const));

  return (
    <Page>
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-sm text-foreground/65">{t('subtitle')}</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t('pendingClaims')}</h2>
        <AdminClaimsPanel
          claims={pending.map((claim) => ({
            id: claim.id,
            orgSlug: claim.orgSlug,
            orgName: nameBySlug.get(claim.orgSlug) ?? claim.orgSlug,
            claimEmail: claim.claimEmail,
            proofMessage: claim.proofMessage,
            createdAt: claim.createdAt.toISOString(),
          }))}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">{t('inviteTitle')}</h2>
        <p className="mt-1 text-sm text-foreground/60">{t('inviteBody')}</p>
        <div className="mt-4">
          <AdminInviteForm />
        </div>
      </section>
    </Page>
  );
}
