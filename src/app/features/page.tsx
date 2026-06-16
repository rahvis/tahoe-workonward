import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const metadata: Metadata = {
    title: 'Features',
    description: 'Explore Tahoe AI features for AI candidate sourcing, shortlist management, enrichment, outreach sequencing, mailbox pacing, and recruiting analytics.',
    alternates: {
        canonical: '/features',
    },
    openGraph: {
        title: 'Features | Tahoe AI',
        description: 'AI sourcing, candidate lists, enrichment, outreach, mailbox controls, and analytics in one recruiter workflow.',
        url: '/features',
        siteName: 'Tahoe AI',
        images: OG_IMAGES,
        type: 'website',
    },
};

const featureJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE_URL}/features` },
    ],
};

const features = [
    ['AI candidate sourcing', 'Search by role brief, skills, geography, seniority, target companies, and exclusions without writing Boolean syntax from scratch.'],
    ['Shortlist and project workflows', 'Save candidates to the right project, preserve source context, and inspect list readiness before enrichment or outreach.'],
    ['Contact enrichment', 'Estimate and run work email, personal email, and phone enrichment with visible credit impact and clear result state.'],
    ['Outreach sequencing', 'Build email sequences with sender, timing, unsubscribe, bounce, reply, and suppression rules visible before launch.'],
    ['Mailbox health', 'Inspect sender connection, daily cap, send window, pacing, and stop reasons so campaigns do not hide operational limits.'],
    ['Recruiting analytics', 'Track search, save, enrich, send, reply, and credit movement from one operating dashboard.'],
];

export default function FeaturesPage() {
    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(featureJsonLd).replace(/</g, '\\u003c') }}
            />
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Features</span>
                        <h1>Every step from finding a candidate to getting a reply.</h1>
                        <p>
                            Search, build shortlists, enrich contacts, send outreach, keep your sender healthy, and see
                            what is working. It all stays connected after the first result page.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {features.map(([title, body], index) => (
                            <article key={title} className={styles.featureCard}>
                                <div className={styles.featureCardTop}>
                                    <span className={styles.featureTag}>0{index + 1}</span>
                                </div>
                                <h2>{title}</h2>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/signup" className={styles.primaryAction}>Start for free</Link>
                        <Link href="/pricing" className={styles.ghostAction}>View pricing</Link>
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
