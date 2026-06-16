import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/config';
import { buildOgLocale } from '@/i18n/metadata';
import { OG_IMAGES } from '@/lib/og';
import { organizationLd, websiteLd, softwareApplicationLd } from '@/lib/structured-data';
import HtmlLangSync from '@/components/i18n/HtmlLangSync';
import JsonLd from '@/components/seo/JsonLd';

// Statically render both locales.
export function generateStaticParams() {
    return locales.map((lang) => ({ lang }));
}

// Locale-level defaults: og:locale + a fallback OG image, applied to any page in
// this segment that does not set its own openGraph (e.g. the client home, auth,
// and partner pages). Pages with their own metadata add their own canonical +
// hreflang; the sitemap carries hreflang for every URL regardless.
export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    return {
        openGraph: {
            siteName: 'Tahoe AI',
            type: 'website',
            images: OG_IMAGES,
            ...buildOgLocale(locale),
        },
    };
}

export default async function LangLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isLocale(lang)) {
        notFound();
    }
    return (
        <>
            <HtmlLangSync lang={lang} />
            <JsonLd data={[organizationLd(), websiteLd(lang), softwareApplicationLd(lang)]} />
            {children}
        </>
    );
}
