import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { CheckCircledIcon } from '@/components/ui/icons';
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
    const t = (await getDictionary(locale)).features;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/features'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/features`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function FeaturesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).features;
    const L = (path: string) => `/${locale}${path}`;

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.breadcrumbHome, item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: t.breadcrumb, item: `${SITE_URL}/${locale}/features` },
        ],
    };

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <JsonLd data={breadcrumbLd} />

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow1}</span>
                        <h1>{t.h1}</h1>
                        <p>{t.lede1}</p>
                    </div>
                    <div className={styles.featureGrid}>
                        {t.features.map(([title, body], index) => (
                            <article key={title} className={styles.featureCard}>
                                <div className={styles.featureCardTop}>
                                    <span className={styles.featureTag}>0{index + 1}</span>
                                </div>
                                <h2>{title}</h2>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow2}</span>
                        <h2>{t.h2}</h2>
                        <p>{t.lede2}</p>
                    </div>
                    <div className={styles.featureGrid}>
                        {t.sourcing.map(([title, body]) => (
                            <article key={title} className={styles.featureCard}>
                                <h3>{title}</h3>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow3}</span>
                        <h2>{t.h3}</h2>
                        <p>{t.lede3}</p>
                    </div>
                    <div className={styles.checkList}>
                        {t.reach.map((line) => (
                            <span key={line}><CheckCircledIcon /> {line}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow4}</span>
                        <h2>{t.h4}</h2>
                        <p>{t.lede4}</p>
                    </div>
                    <div className={styles.featureGrid}>
                        {t.analytics.map(([title, body]) => (
                            <article key={title} className={styles.featureCard}>
                                <h3>{title}</h3>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>{t.eyebrow5}</span>
                        <h2>{t.h5}</h2>
                        <p>{t.lede5}</p>
                    </div>
                    <div className={styles.heroActions}>
                        <Link href={L('/signup')} className={styles.primaryAction}>{t.ctaStart}</Link>
                        <Link href={L('/pricing')} className={styles.ghostAction}>{t.ctaPricing}</Link>
                    </div>
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
