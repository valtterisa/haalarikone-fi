import Script from 'next/script';
import { getTranslations } from 'next-intl/server';

export default async function FAQSchema({ locale }: { locale: string }) {
    const t = await getTranslations({ locale, namespace: 'faq' });
    
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: t('q1'),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: t('a1'),
                },
            },
            {
                '@type': 'Question',
                name: t('q2'),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: t('a2'),
                },
            },
            {
                '@type': 'Question',
                name: t('q3'),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: t('a3'),
                },
            },
            {
                '@type': 'Question',
                name: t('q4'),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: t('a4'),
                },
            },
            {
                '@type': 'Question',
                name: t('q5'),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: t('a5'),
                },
            },
            {
                '@type': 'Question',
                name: t('q6'),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: t('a6'),
                },
            },
        ],
    };

    return (
        <Script
            id="faq-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
    );
}

