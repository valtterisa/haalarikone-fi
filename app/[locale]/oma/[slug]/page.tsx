import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { Page } from '@/components/page';
import { getSession } from '@/lib/auth-session';
import { getOrganizationProfile } from '@/lib/org-profile';
import { loadUniversities } from '@/lib/load-universities';
import { OrgProfileEditor } from '@/components/org/org-profile-editor';
import { Link } from '@/i18n/routing';
import { SITE_ORIGIN } from '@/lib/site-url';
import type { Locale } from '@/lib/slug-translations';

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'editor' });
  return {
    title: `${t('pageTitle')} | Haalarikone`,
    robots: { index: false, follow: false },
  };
}

export default async function EditOrgPage({ params }: Props) {
  const { locale, slug } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect(`/kirjaudu?next=/oma/${slug}`);
  }

  const [profile, universities] = await Promise.all([
    getOrganizationProfile(slug),
    loadUniversities(locale),
  ]);
  const overall = universities.find((u) => u.slug === slug);

  if (!profile || !overall || profile.claimedByUserId !== session.user.id) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'editor' });
  const embedSnippet = `<iframe src="${SITE_ORIGIN}/embed/haalari/${slug}" title="${overall.ainejarjesto ?? slug}" width="360" height="160" style="border:0;border-radius:12px;overflow:hidden" loading="lazy"></iframe>`;

  return (
    <Page>
      <Link href="/oma" className="text-sm font-medium text-green hover:underline">
        ← {t('back')}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {profile.displayName ?? overall.ainejarjesto ?? slug}
      </h1>
      <p className="mt-2 text-sm text-foreground/60">{t('subtitle')}</p>
      <div className="mt-8">
        <OrgProfileEditor
          profile={profile}
          fallbackName={overall.ainejarjesto ?? slug}
          fallbackHex={overall.hex}
          embedSnippet={embedSnippet}
        />
      </div>
    </Page>
  );
}
