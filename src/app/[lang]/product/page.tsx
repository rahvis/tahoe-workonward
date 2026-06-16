import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { CheckCircledIcon } from '@/components/ui/icons';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';
const PRODUCT_DESCRIPTION = 'Tahoe AI connects candidate sourcing, lists, contact enrichment, outreach sequencing, mailbox controls, credits, and analytics in one recruiter workflow.';

export const metadata: Metadata = {
    title: 'Product',
    description: PRODUCT_DESCRIPTION,
    alternates: {
        canonical: '/product',
    },
    openGraph: {
        title: 'Product | Tahoe AI',
        description: 'One connected AI recruiting platform for sourcing, enrichment, outreach, and analytics.',
        url: '/product',
        siteName: 'Tahoe AI',
        images: OG_IMAGES,
        type: 'website',
    },
};

const productJsonLd = [
    {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Tahoe AI',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'AI recruiting software',
        operatingSystem: 'Web',
        url: `${SITE_URL}/product`,
        description: PRODUCT_DESCRIPTION,
        publisher: {
            '@type': 'Organization',
            name: 'Tahoe AI',
            url: SITE_URL,
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Product', item: `${SITE_URL}/product` },
        ],
    },
];

const workflow = [
    ['Search in your own words', 'Describe the hire in plain language and preserve the role intent, filters, exclusions, and source context.'],
    ['Candidate lists', 'Move selected profiles into operational lists with ownership, project, enrichment state, and next actions.'],
    ['Contact enrichment', 'Estimate work email, phone, and verification costs before provider-backed enrichment runs.'],
    ['Native outreach', 'Launch sequences from connected mailboxes with visible caps, send windows, stop rules, and reply state.'],
    ['Credits and analytics', 'Connect searches, enrichments, sends, replies, and credit movement to the decisions recruiters need to make.'],
];

const benefits = [
    ['Context is never lost', 'The role brief, filters, exclusions, and source notes travel with every candidate, from the first query all the way to the final send.'],
    ['Spend stays visible', 'Enrichment and outreach draw from credits you can see before you commit, so the month never ends with a surprise invoice.'],
    ['Nothing to stitch together', 'Sourcing, lists, enrichment, mailboxes, and analytics already speak the same language, so there is no integration to babysit.'],
];

const measures = [
    ['Sourcing', 'Searches run, profiles previewed, shortlists built, and how often a query turns into a saved candidate.'],
    ['Enrichment', 'Work email, personal email, and phone reveals, with the credit cost and result state attached to each one.'],
    ['Outreach', 'Sends, opens, replies, bounces, and suppressions, tied back to the campaign and the mailbox they came from.'],
    ['Spend', 'Every credit movement, mapped to the search, enrichment, or send that caused it, with nothing hidden.'],
];

const principles = [
    'Outreach goes from real, connected mailboxes, so candidates see a sender they already recognize.',
    'Credits, caps, and pacing stay on screen, never buried three settings pages deep.',
    'Source context and citations stay attached, so any shortlist decision is one you can explain.',
    'Send windows, stop rules, and suppression state are visible before a campaign goes out, not after.',
];

export default function ProductPage() {
    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
            />

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Product</span>
                        <h1>One connected workflow, from search to sent.</h1>
                        <p>
                            Describe who you are looking for, build shortlists, find verified contact details, send from
                            your own inbox, and measure it all, without stitching together a fragile tool stack.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {workflow.map(([title, body], index) => (
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
                        <span className={styles.sectionEyebrow}>Why it matters</span>
                        <h2>One workspace beats a stack of tools.</h2>
                        <p>
                            Most recruiting setups lose the thread between sourcing, enrichment, and outreach. Tahoe keeps
                            the whole path in one place, so the work stays connected after the first result page.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {benefits.map(([title, body]) => (
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
                        <span className={styles.sectionEyebrow}>Built to stay honest</span>
                        <h2>The product shows its work.</h2>
                        <p>
                            Recruiting tools earn trust by being inspectable, not by hiding decisions behind automation.
                            Tahoe keeps the things that matter in plain view.
                        </p>
                    </div>
                    <div className={styles.checkList}>
                        {principles.map((line) => (
                            <span key={line}><CheckCircledIcon /> {line}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Measure everything</span>
                        <h2>See what each step is actually doing.</h2>
                        <p>
                            Analytics connect every search, enrichment, send, and reply back to the credits they used and
                            the outcomes they produced, so reporting points at real work.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {measures.map(([title, body]) => (
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
                        <span className={styles.sectionEyebrow}>Start today</span>
                        <h2>Run your first search in two minutes.</h2>
                        <p>Continue with Google or email, no credit card, and see your first shortlist before lunch.</p>
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/signup" className={styles.primaryAction}>Start for free</Link>
                        <Link href="/features" className={styles.ghostAction}>Explore features</Link>
                    </div>
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
