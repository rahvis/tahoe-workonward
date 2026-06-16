import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import JsonLd from '@/components/seo/JsonLd';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).contact;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/contact'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/contact`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).contact;
    const L = (path: string) => `/${locale}${path}`;

    const contactJsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Tahoe AI',
            url: `${SITE_URL}/${locale}/contact`,
            mainEntity: {
                '@type': 'Organization',
                name: 'Tahoe AI',
                email: 'info@workonward.com',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: '124 E 14th St',
                    addressLocality: 'New York',
                    addressRegion: 'NY',
                    postalCode: '10003',
                    addressCountry: 'US',
                },
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: t.breadcrumbHome, item: `${SITE_URL}/${locale}` },
                { '@type': 'ListItem', position: 2, name: t.breadcrumb, item: `${SITE_URL}/${locale}/contact` },
            ],
        },
    ];

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <JsonLd data={contactJsonLd} />
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow}</span>
                        <h1>{t.h1}</h1>
                        <p>{t.lede}</p>
                    </div>
                    <div className={styles.featureGrid}>
                        <article className={styles.featureCard}>
                            <h2>{t.emailHeading}</h2>
                            <p><a href="mailto:info@workonward.com">info@workonward.com</a></p>
                        </article>
                        <article className={styles.featureCard}>
                            <h2>{t.addressHeading}</h2>
                            <p>{t.address}</p>
                        </article>
                        <article className={styles.featureCard}>
                            <h2>{t.partnershipsHeading}</h2>
                            <p>{t.partnershipsBody}</p>
                        </article>
                    </div>
                    <div className={styles.heroActions}>
                        <Link href={L('/partner')} className={styles.primaryAction}>{t.ctaPartner}</Link>
                        <Link href={L('/signup')} className={styles.ghostAction}>{t.ctaStart}</Link>
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
