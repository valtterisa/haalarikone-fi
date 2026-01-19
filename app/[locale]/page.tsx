import SearchContainer from "@/components/search-container";
import { loadUniversities } from "@/lib/load-universities";
import { loadColorData } from "@/lib/load-color-data";
import FAQSchema from "@/components/faq-schema";
import Script from "next/script";
import { FeedbackModal } from "@/components/feedback-modal";
import { getTranslations } from 'next-intl/server';
import { Link } from "@/i18n/routing";
import { Palette, Layers, GraduationCap, BookOpen } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'meta' });

    return {
        title: t('defaultTitle'),
        description: t('defaultDescription'),
    };
}

export default async function Index({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const universities = await loadUniversities(locale as 'fi' | 'en' | 'sv');
    const colorData = await loadColorData();
    const t = await getTranslations({ locale });

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: t('meta.siteName'),
        url: "https://haalarikone.fi",
        description: t('home.description'),
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `https://haalarikone.fi${locale === 'fi' ? '' : `/${locale}`}?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: t('meta.siteName'),
        url: "https://haalarikone.fi",
        description: t('home.description'),
        logo: {
            "@type": "ImageObject",
            url: "https://haalarikone.fi/haalarikone-og.png",
            width: 1200,
            height: 630,
        },
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            availableLanguage: locale === 'fi' ? "Finnish" : locale === 'en' ? "English" : "Swedish",
        },
        sameAs: [],
    };

    return (
        <>
            <Script
                id="website-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
            />
            <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <FAQSchema locale={locale} />
            <div className="bg-white w-full min-h-screen flex flex-col items-center">
                <div className="flex flex-col items-center justify-center pt-8 pb-4">

                    <div className="relative">
                        <h1
                            className="w-fit text-4xl md:text-7xl font-bold text-center"
                            style={{
                                background:
                                    "linear-gradient(120deg, #65a30d 0%, #65a30d 100%) no-repeat",
                                backgroundPosition: "0 95%",
                                backgroundSize: "100% 0.25em",
                                fontWeight: "inherit",
                                color: "inherit",
                            }}
                        >
                            {t('home.title')}
                        </h1>
                    </div>

                    <p className="text-center max-w-2xl mx-auto px-4 mt-6 mb-4">
                        {t('home.description')}
                    </p>
                </div>
                <SearchContainer initialUniversities={universities} colorData={colorData} />

                <section className="w-full border-t border-border/60 mt-12">
                    <div className="container mx-auto px-4 py-12">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                                {t('nav.navigate')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/vari"
                                    className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-all hover:border-green hover:bg-green/5 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
                                        <Palette className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {t('nav.allColors')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('nav.colorsDescription')}
                                        </p>
                                    </div>
                                </Link>
                                <Link
                                    href="/ala"
                                    className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-all hover:border-green hover:bg-green/5 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
                                        <Layers className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {t('nav.allFields')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('nav.fieldsDescription')}
                                        </p>
                                    </div>
                                </Link>
                                <Link
                                    href="/oppilaitos"
                                    className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-all hover:border-green hover:bg-green/5 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {t('nav.allSchools')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('nav.schoolsDescription')}
                                        </p>
                                    </div>
                                </Link>
                                <Link
                                    href="/blog"
                                    className="flex items-center gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-all hover:border-green hover:bg-green/5 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {t('common.blog')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('nav.navigateDescription')}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="palaute"
                    className="w-full border-t border-border/60 bg-[#f8faf3] mt-12"
                >
                    <div className="container mx-auto px-4 py-12">
                        <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
                            <h3 className="text-2xl font-bold">
                                {t('home.feedbackTitle')}
                            </h3>
                            <p className="text-muted-foreground">
                                {t('home.feedbackDescription')}
                            </p>
                            <FeedbackModal
                                triggerLabel={t('home.feedbackButton')}
                                triggerClassName="bg-green text-white hover:bg-green/90 self-center"
                                triggerSize="lg"
                                title={t('home.feedbackTitle')}
                                description={t('home.feedbackDescription')}
                                submitLabel={t('feedback.submit')}
                                messageLabel={t('feedback.message')}
                                messagePlaceholder={t('feedback.messagePlaceholder')}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

