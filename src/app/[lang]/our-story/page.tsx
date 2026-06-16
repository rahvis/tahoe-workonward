import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { LakeScene, PineRidge, PineTree } from './TahoeSketches';
import WaterWaves from './WaterWaves';
import pageStyles from '../page.module.css';
import styles from './our-story.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const metadata: Metadata = {
    title: 'Our Story',
    description:
        'Tahoe is an AI-powered recruiting platform by WorkOnward. Named after Lake Tahoe for its depth and clarity, it helps recruiters discover, enrich, and engage talent from one place.',
    alternates: {
        canonical: '/our-story',
    },
    openGraph: {
        title: 'Our Story | Tahoe AI',
        description:
            'Why we built Tahoe: an AI-powered recruiting platform by WorkOnward for talent discovery, enrichment, and engagement.',
        url: '/our-story',
        siteName: 'Tahoe AI',
        images: OG_IMAGES,
        type: 'article',
    },
};

const storyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Our Story', item: `${SITE_URL}/our-story` },
    ],
};

export default function OurStoryPage() {
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
                            Why we named it <em>Tahoe</em>.
                        </h1>
                        <p className={styles.heroLede}>
                            Tahoe is an AI-powered recruiting platform designed to help recruiters
                            discover, enrich, and engage talent more efficiently.
                        </p>
                    </div>
                </div>
            </section>

            {/* Chapter 1: the lake */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineLeft}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>Named for depth and clarity</h2>
                        <p className={styles.para}>
                            Named after Lake Tahoe, known for its depth and clarity, Tahoe reflects
                            our belief that great recruiting goes beyond simple keyword matching.
                            Recruiters need better tools to uncover talent, understand potential, and
                            build meaningful connections.
                        </p>
                    </div>
                </div>
            </section>

            {/* Quote 1 */}
            <section className={styles.quoteWrap}>
                <WaterWaves />
                <div className={pageStyles.container}>
                    <p className={styles.quote}>
                        <span className={styles.quoteMark} aria-hidden="true">“</span>
                        The best candidates are often hidden beneath the surface.
                        <span className={styles.quoteMark} aria-hidden="true">”</span>
                    </p>
                </div>
            </section>

            <div className={styles.divider}>
                <PineRidge className={styles.dividerRidge} />
            </div>

            {/* Chapter 2: the recruiter's noise */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineRight}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>Why we built Tahoe</h2>
                        <p className={styles.para}>
                            We built Tahoe after years of experience in recruiting and workforce
                            development. Like many recruiters, we experienced the challenges of
                            managing multiple sourcing tools, searching through large candidate
                            databases, enriching contact information, and manually coordinating
                            outreach campaigns. Too much time was spent on administrative work and not
                            enough on building relationships with candidates.
                        </p>
                        <p className={styles.para}>
                            Tahoe brings these workflows together into a single platform. Recruiters
                            can search for talent using natural language, discover qualified
                            candidates, enrich contact information, organize prospects into projects,
                            and manage outreach more effectively, all from one place.
                        </p>
                    </div>
                </div>
            </section>

            {/* Quote 2 */}
            <section className={styles.quoteWrap}>
                <WaterWaves />
                <div className={pageStyles.container}>
                    <p className={styles.quote}>
                        <span className={styles.quoteMark} aria-hidden="true">“</span>
                        Built by recruiters, for recruiters.
                        <span className={styles.quoteMark} aria-hidden="true">”</span>
                    </p>
                </div>
            </section>

            <div className={styles.divider}>
                <PineRidge className={styles.dividerRidge} />
            </div>

            {/* Chapter 3: what Tahoe became */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineLeft}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>Powered by WorkOnward</h2>
                        <p className={styles.para}>
                            Tahoe is powered by WorkOnward, a workforce technology company committed to
                            creating better connections between talent and opportunity. Our mission is
                            to help employers find the right people faster while improving access to
                            career opportunities for job seekers from all backgrounds.
                        </p>
                        <p className={styles.para}>
                            By combining AI-powered search, talent intelligence, and recruiting
                            workflows, Tahoe helps recruiting teams focus on what matters most:
                            building relationships and making great hires.
                        </p>
                    </div>
                </div>
            </section>

            {/* Closing */}
            <section className={styles.closing}>
                <div className={pageStyles.container}>
                    <span className={pageStyles.sectionEyebrow}>Tahoe by WorkOnward</span>
                    <h2 className={styles.closingTitle}>Find the right people, faster.</h2>
                    <p className={styles.closingLede}>
                        AI-powered talent discovery and engagement for modern recruiting teams.
                        Continue with Google or email, and start in minutes.
                    </p>
                    <div className={styles.closingActions}>
                        <Link href="/signup" className={pageStyles.primaryAction}>Start for free</Link>
                        <Link href="/product" className={pageStyles.ghostAction}>See the product</Link>
                    </div>
                    <p className={styles.signature}>Made with care, by the team at WorkOnward.</p>
                    <PineRidge className={styles.closingRidge} />
                </div>
            </section>

            <PublicSiteFooter placement="our_story" />
        </main>
    );
}
