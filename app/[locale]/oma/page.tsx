import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Page } from '@/components/page';
import { getSession } from '@/lib/auth-session';
import { listClaimsByUser, listProfilesByUser } from '@/lib/org-profile';
import { Link } from '@/i18n/routing';
import { loadUniversities } from '@/lib/load-universities';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/slug-translations';
import { SignOutButton } from '@/components/auth/sign-out-button';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return {
    title: `${t('title')} | Haalarikone`,
    robots: { index: false, follow: false },
  };
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect('/kirjaudu?next=/oma');
  }

  const t = await getTranslations({ locale, namespace: 'dashboard' });
  const [profiles, claims, universities] = await Promise.all([
    listProfilesByUser(session.user.id),
    listClaimsByUser(session.user.id),
    loadUniversities(locale),
  ]);

  const nameBySlug = new Map(universities.map((u) => [u.slug, u.ainejarjesto ?? u.slug] as const));

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-foreground/65">
            {t('signedInAs', { email: session.user.email })}
          </p>
        </div>
        <SignOutButton label={t('signOut')} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">{t('myOrgs')}</h2>
        {profiles.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">{t('noOrgs')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {profiles.map((profile) => (
              <li
                key={profile.orgSlug}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {profile.displayName ?? nameBySlug.get(profile.orgSlug) ?? profile.orgSlug}
                  </p>
                  <p className="text-xs text-foreground/50">{profile.orgSlug}</p>
                </div>
                <Button asChild size="sm" className="bg-green text-white hover:bg-green/90">
                  <Link href={{ pathname: '/oma/[slug]', params: { slug: profile.orgSlug } }}>
                    {t('edit')}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">{t('myClaims')}</h2>
        {claims.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">{t('noClaims')}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <span>{nameBySlug.get(claim.orgSlug) ?? claim.orgSlug}</span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {t(`status.${claim.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
