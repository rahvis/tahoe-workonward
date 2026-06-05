import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
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
        description: 'A connected AI recruiting operating system for sourcing, enrichment, outreach, and analytics.',
        url: '/product',
        siteName: 'Tahoe AI',
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
    ['Plain-English search', 'Describe the hire in recruiter language and preserve the role intent, filters, exclusions, and source context.'],
    ['Candidate lists', 'Move selected profiles into operational lists with ownership, project, enrichment state, and next actions.'],
    ['Contact enrichment', 'Estimate work email, phone, and verification costs before provider-backed enrichment runs.'],
    ['Native outreach', 'Launch sequences from connected mailboxes with visible caps, send windows, stop rules, and reply state.'],
    ['Credits and analytics', 'Connect searches, enrichments, sends, replies, and credit movement to the decisions recruiters need to make.'],
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
                        <h1>Tahoe AI is the connected recruiting operating system.</h1>
                        <p>
                            Search in plain English, save candidates into lists, enrich contact data, send from real
                            mailboxes, and measure recruiting movement without stitching together a fragile tool stack.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {workflow.map(([title, body], index) => (
                            <article key={title} className={styles.featureCard}>
                                <div className={styles.featureCardTop}>
                                    <span className={styles.featureTag}>— 0{index + 1}</span>
                                </div>
                                <h2>{title}</h2>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/signup" className={styles.primaryAction}>Start free trial</Link>
                        <Link href="/features" className={styles.ghostAction}>Explore features</Link>
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
