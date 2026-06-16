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
                            strange thing about it, the thing that stays with you long after you have
                            left the shore, is that its clarity comes from its depth rather than in
                            spite of it. You can stand at its edge on a still morning and look down
                            through what feels like an impossible distance, past the light and into
                            the cold, and the water does not hide what lives there; it holds it,
                            patiently, in view.
                        </p>
                        <p className={styles.para}>
                            We kept returning to that idea while we were building, because it is rare
                            and because it is precious. Most deep things are murky. Most clear things
                            are shallow. A place that is both at once felt less like a body of water
                            and more like a quiet promise about how seeing could work, if only the
                            conditions were calm enough to allow it.
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
                            current of half-finished profiles, duplicated records, titles that went
                            stale two roles ago, and signals that contradict one another by the
                            thousand. The right person is almost always somewhere in that current,
                            yet the surface is so busy, so loud with everything that is merely close
                            to relevant, that the search slowly stops being a matter of judgment and
                            becomes a matter of endurance.
                        </p>
                        <p className={styles.para}>
                            We watched thoughtful recruiters spend their best hours wading rather than
                            deciding, squinting into the murk instead of meeting the person waiting on
                            the other side of it. And we came to believe something simple and a little
                            sad: when a wonderful candidate is missed, it is seldom because they were
                            unworthy of being found. It is because the water was never clear enough for
                            anyone to see them in time.
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

            {/* Chapter 3: the turn */}
            <section className={styles.chapter}>
                <PineTree className={`${styles.sidePine} ${styles.sidePineLeft}`} />
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>So we chose depth over more noise</h2>
                        <p className={styles.para}>
                            It would have been easy to build one more tool that adds to the current,
                            another stream of alerts and dashboards and lists that ask for your
                            attention without ever quite earning your trust. We did not want that. We
                            wanted, if anything, the opposite of that. We wanted to take the whole
                            tangled work of finding a person and reaching out to them and distill it,
                            slowly and stubbornly, until only the clear part was left.
                        </p>
                        <p className={styles.para}>
                            So we made something you can speak to plainly. You describe the person you
                            are hoping to find, in the same ordinary words you would use with a
                            colleague you trust, and the depth answers back; not with more noise, but
                            with clean signal, the kind that points to real people, seen clearly, and
                            close enough to reach.
                        </p>
                    </div>
                </div>
            </section>

            {/* Chapter 4: what Tahoe is */}
            <section className={styles.chapter}>
                <div className={pageStyles.container}>
                    <div className={`${styles.reading} ${styles.chapterInner}`}>
                        <h2 className={styles.chapterTitle}>What Tahoe became</h2>
                        <p className={styles.para}>
                            Tahoe is the most distilled form of a recruiting workflow we knew how to
                            make. Searching, organizing, enriching, and reaching out all happen on one
                            calm surface, so that the work stops feeling like a fight against the water
                            and begins to feel like looking into it. The depth is still there, every
                            bit of it; we only took away the murk that used to settle on top.
                        </p>
                        <p className={styles.para}>
                            What remains is the thing we wanted from the very beginning. You look, and
                            you can see far. And what you see, at that depth and in that stillness, is
                            finally, quietly true.
                        </p>
                    </div>
                </div>
            </section>

            {/* Quote 3 */}
            <section className={styles.quoteWrap}>
                <WaterWaves />
                <div className={pageStyles.container}>
                    <p className={styles.quote}>
                        <span className={styles.quoteMark} aria-hidden="true">“</span>
                        Depth is only frightening while it stays murky; the moment it turns clear, it
                        is simply the truth, waiting to be met.
                        <span className={styles.quoteMark} aria-hidden="true">”</span>
                    </p>
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
