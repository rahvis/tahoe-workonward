import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { CheckCircledIcon } from '@/components/ui/icons';
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

const sourcing = [
    ['Natural-language search', 'Type the role the way you would describe it to a colleague. Tahoe maps it to skills, seniority, geography, and target companies for you.'],
    ['Filters and exclusions that stick', 'Add must-haves, nice-to-haves, and hard exclusions, and keep them attached to the search so a refinement never starts from scratch.'],
    ['Honest previews', 'See real, reachable results before you spend anything, with match counts you can trust instead of inflated totals.'],
];

const reachCapabilities = [
    'Reveal verified work email, personal email, and phone, with the credit cost shown before every run.',
    'Build sequences with sender, timing, and unsubscribe rules visible before the first message goes out.',
    'Send from your own connected mailbox, so replies land where you already work.',
    'Respect daily caps, send windows, and pacing, so a campaign never quietly burns your sender reputation.',
    'Track bounces, replies, and suppressions automatically, and stop on the rules you set.',
];

const analytics = [
    ['One operating dashboard', 'Search, save, enrich, send, reply, and credit movement in a single view, instead of five disconnected reports.'],
    ['Spend you can trace', 'Every credit maps back to the action that used it, so a finance question always has a clear answer.'],
    ['Outcomes, not vanity metrics', 'Measure what actually moves a role forward, replies and shortlists and hires, not just opens.'],
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
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>From a brief to a shortlist</span>
                        <h2>Sourcing that speaks your language.</h2>
                        <p>
                            The hardest part of sourcing is turning a messy brief into the right people. Tahoe takes plain
                            words and gives back a search you can refine, not a syntax puzzle you have to solve.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {sourcing.map(([title, body]) => (
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
                        <span className={styles.sectionEyebrow}>From a shortlist to a reply</span>
                        <h2>Reach people without risking your sender.</h2>
                        <p>
                            Finding the right person only matters if you can actually reach them. Enrichment and outreach
                            live next to your shortlist, with the controls that keep messages landing in the inbox.
                        </p>
                    </div>
                    <div className={styles.checkList}>
                        {reachCapabilities.map((line) => (
                            <span key={line}><CheckCircledIcon /> {line}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Know what is working</span>
                        <h2>Analytics that point back at real work.</h2>
                        <p>
                            Reporting should answer the questions recruiters and founders actually ask. Tahoe ties every
                            action to the outcome and the spend behind it.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {analytics.map(([title, body]) => (
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
                        <h2>Put every step in one place.</h2>
                        <p>Continue with Google or email, no credit card, and run your first search in two minutes.</p>
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
