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
import pricing from './pricing.module.css';
import PricingTables from './_components/PricingTables';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';
const DEMO_URL =
    'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2TB11Wn_yYLPd8ClWeKR2YyHYCYYjdRm1cJguma5qRyE6IuKaJlVjdugP4zOs96cFr3-mvhO0P';

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

            {/* ── Hero ── */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={pricing.hero}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow}</span>
                        <h1 className={pricing.heroTitle}>{t.h1}</h1>
                        <p className={pricing.heroLede}>{t.lede}</p>
                        <div className={pricing.heroActions}>
                            <Link href={L('/signup')} className={styles.primaryAction}>
                                {t.ctaStart}
                            </Link>
                            <a href={DEMO_URL} target="_blank" rel="noreferrer" className={styles.heroDemoAction}>
                                {t.demoCta}
                            </a>
                        </div>
                        <p className={pricing.heroNote}>{t.ctaStartNote}</p>
                    </div>
                </div>
            </section>

            {/* ── Toggle + plans + credit strip + comparison + top-ups (interactive) ── */}
            <PricingTables t={t} signupHref={L('/signup')} />

            {/* ── FAQ ── */}
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

            {/* ── Final CTA ── */}
            <section className={styles.finalCtaSection}>
                <div className={styles.container}>
                    <div className={pricing.finalCta}>
                        <h2 className={pricing.finalCtaHeading}>{t.finalCta.heading}</h2>
                        <div className={pricing.finalCtaActions}>
                            <Link href={L('/signup')} className={pricing.finalCtaPrimary}>
                                {t.finalCta.start}
                            </Link>
                            <a href={DEMO_URL} target="_blank" rel="noreferrer" className={pricing.finalCtaSecondary}>
                                {t.finalCta.demo}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
