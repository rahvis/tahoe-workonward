import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { faqLd } from '@/lib/structured-data';
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
    const t = (await getDictionary(locale)).pricing;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/pricing'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/pricing`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function PricingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).pricing;
    const L = (path: string) => `/${locale}${path}`;

    const offerLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Tahoe AI',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'AI recruiting software',
        operatingSystem: 'Web',
        url: `${SITE_URL}/${locale}/pricing`,
        offers: {
            '@type': 'Offer',
            name: t.planName,
            price: '49',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${SITE_URL}/${locale}/pricing`,
            priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '49',
                priceCurrency: 'USD',
                unitText: 'month',
            },
        },
    };
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.breadcrumbHome, item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: t.breadcrumb, item: `${SITE_URL}/${locale}/pricing` },
        ],
    };

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <JsonLd data={[offerLd, breadcrumbLd, faqLd(t.faq.map(([q, a]) => ({ q, a })))]} />

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.pricingGrid}>
                        <div className={styles.pricingCopy}>
                            <span className={styles.sectionEyebrow}>{t.eyebrow}</span>
                            <h1>{t.h1}</h1>
                            <p>{t.lede}</p>
                            <Link href={L('/signup')} className={styles.primaryAction}>{t.ctaStart}</Link>
                        </div>
                        <div className={styles.pricingCard}>
                            <div className={styles.pricingFeaturedRow}>
                                <div className={styles.featuredBrand}>{t.planName}</div>
                                <div className={styles.barTrack}>
                                    <div className={styles.barFillAccent} style={{ width: '100%' }} />
                                </div>
                                <div className={styles.priceCell}>
                                    <strong>$49</strong>
                                    <span>{t.perMonth}</span>
                                    <small>{t.cancelAnytime}</small>
                                </div>
                            </div>
                            {t.planFeatures.map((item) => (
                                <div key={item} className={styles.detailLine}>{item}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.faqEyebrow}</span>
                        <h2>{t.faqHeading}</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {t.faq.map(([question, answer]) => (
                            <article key={question} className={styles.featureCard}>
                                <h3>{question}</h3>
                                <p>{answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
