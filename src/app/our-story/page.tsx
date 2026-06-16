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
        'Why we built Tahoe AI. The story behind a recruiting platform shaped by the depth and clarity of Lake Tahoe, made to turn noisy candidate data into clean, human signal.',
    alternates: {
        canonical: '/our-story',
    },
    openGraph: {
        title: 'Our Story | Tahoe AI',
        description:
            'Why we created Tahoe AI: a calmer, clearer way to search for the people behind the noise.',
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
                            Because somewhere beneath the noise of every search there is a person who
                            is exactly right, and we wanted to build a place clear enough, and quiet
                            enough, to finally see them.
                        </p>
                    </div>
                </div>
            </section>

            {/* Chapter 1: the lake */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineLeft}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>The clearest water we know</h2>
                        <p className={styles.para}>
                            Lake Tahoe is one of the deepest and clearest lakes on earth, and the
                            strange thing about it, the thing that stays with you, is that its clarity
                            comes from its depth rather than in spite of it. Most deep things are
                            murky and most clear things are shallow; a place that is somehow both at
                            once felt less like a body of water and more like a quiet promise about
                            how seeing could work, if only the conditions were calm enough to allow it.
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
                        Still water is not empty water; it is water you have finally grown quiet
                        enough to see through.
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
                        <h2 className={styles.chapterTitle}>The noise a recruiter lives in</h2>
                        <p className={styles.para}>
                            A recruiter does not work in clear water. A recruiter works in a fast
                            current of half-finished profiles, stale titles, and signals that
                            contradict one another by the thousand, where the right person is almost
                            always present yet almost never easy to see. When a wonderful candidate is
                            missed, it is seldom because they were unworthy of being found; it is
                            because the water was never clear enough for anyone to see them in time.
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
                        The candidate you are searching for is rarely missing; far more often, they
                        are only hard to see.
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
                        <h2 className={styles.chapterTitle}>What Tahoe became</h2>
                        <p className={styles.para}>
                            So we set out to build the opposite of one more noisy tool. We took the
                            whole tangled work of finding a person and reaching out to them and
                            distilled it, stubbornly, until only the clear part was left: you describe
                            who you are hoping to find in plain words, and the depth answers back with
                            clean signal, real people seen clearly and close enough to reach. The
                            depth is still there, every bit of it; we only took away the murk that
                            used to settle on top.
                        </p>
                    </div>
                </div>
            </section>

            {/* Closing */}
            <section className={styles.closing}>
                <div className={pageStyles.container}>
                    <span className={pageStyles.sectionEyebrow}>Come closer</span>
                    <h2 className={styles.closingTitle}>Come and look into the water.</h2>
                    <p className={styles.closingLede}>
                        If you have ever felt the quiet tiredness of searching through noise, then we
                        built this for you, and we would love for you to see what clarity can feel
                        like.
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
