import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { LakeScene, PineRidge, PineTree } from './TahoeSketches';
import WaterWaves from './WaterWaves';
import pageStyles from '../page.module.css';
import styles from './our-story.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).ourStory;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/our-story'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/our-story`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'article',
            ...buildOgLocale(locale),
        },
    };
}

export default async function OurStoryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).ourStory;
    const L = (path: string) => `/${locale}${path}`;

    const storyJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.breadcrumbHome, item: `${SITE_URL}/${locale}` },
            { '@type': 'ListItem', position: 2, name: t.breadcrumbStory, item: `${SITE_URL}/${locale}/our-story` },
        ],
    };

    return (
        <main className={pageStyles.page}>
            <PublicSiteHeader placement="our_story" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(storyJsonLd).replace(/</g, '\\u003c') }}
            />

            {/* Hero */}
            <section className={styles.hero}>
                <LakeScene className={styles.heroLake} />
                <div className={pageStyles.container}>
                    <div className={styles.heroInner}>
                        <h1 className={styles.heroTitle}>
                            {t.heroTitlePre}
                            <em>{t.heroEm}</em>
                            {t.heroTitlePost}
                        </h1>
                        <p className={styles.heroLede}>{t.heroLede}</p>
                    </div>
                </div>
            </section>

            {/* Chapter 1 */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineLeft}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>{t.chapter1Title}</h2>
                        <p className={styles.para}>{t.chapter1Body}</p>
                    </div>
                </div>
            </section>

            {/* Quote 1 */}
            <section className={styles.quoteWrap}>
                <WaterWaves />
                <div className={pageStyles.container}>
                    <p className={styles.quote}>
                        <span className={styles.quoteMark} aria-hidden="true">“</span>
                        {t.quote1}
                        <span className={styles.quoteMark} aria-hidden="true">”</span>
                    </p>
                </div>
            </section>

            <div className={styles.divider}>
                <PineRidge className={styles.dividerRidge} />
            </div>

            {/* Chapter 2 */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineRight}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>{t.chapter2Title}</h2>
                        <p className={styles.para}>{t.chapter2Body1}</p>
                        <p className={styles.para}>{t.chapter2Body2}</p>
                    </div>
                </div>
            </section>

            {/* Quote 2 */}
            <section className={styles.quoteWrap}>
                <WaterWaves />
                <div className={pageStyles.container}>
                    <p className={styles.quote}>
                        <span className={styles.quoteMark} aria-hidden="true">“</span>
                        {t.quote2}
                        <span className={styles.quoteMark} aria-hidden="true">”</span>
                    </p>
                </div>
            </section>

            <div className={styles.divider}>
                <PineRidge className={styles.dividerRidge} />
            </div>

            {/* Chapter 3 */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineLeft}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>{t.chapter3Title}</h2>
                        <p className={styles.para}>{t.chapter3Body1}</p>
                        <p className={styles.para}>{t.chapter3Body2}</p>
                    </div>
                </div>
            </section>

            {/* Closing */}
            <section className={styles.closing}>
                <div className={pageStyles.container}>
                    <span className={pageStyles.sectionEyebrow}>{t.closingEyebrow}</span>
                    <h2 className={styles.closingTitle}>{t.closingTitle}</h2>
                    <p className={styles.closingLede}>{t.closingLede}</p>
                    <div className={styles.closingActions}>
                        <Link href={L('/signup')} className={pageStyles.primaryAction}>{t.ctaStart}</Link>
                        <Link href={L('/product')} className={pageStyles.ghostAction}>{t.ctaProduct}</Link>
                    </div>
                    <p className={styles.signature}>{t.signature}</p>
                    <PineRidge className={styles.closingRidge} />
                </div>
            </section>

            <PublicSiteFooter placement="our_story" />
        </main>
    );
}
