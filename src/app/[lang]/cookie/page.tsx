import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { legalContent } from '@/i18n/legal-content';
import LegalPage from '@/components/legal/LegalPage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const doc = legalContent[locale].cookie;
    return {
        title: doc.metaTitle,
        description: doc.metaDescription,
        alternates: buildAlternates(locale, '/cookie'),
        openGraph: {
            title: `${doc.metaTitle} | Tahoe AI`,
            description: doc.metaDescription,
            url: `/${locale}/cookie`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function CookiePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = legalContent[locale];
    return <LegalPage doc={t.cookie} locale={locale} lastUpdatedLabel={t.lastUpdatedLabel} />;
}
