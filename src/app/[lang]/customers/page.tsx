import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { CheckCircledIcon } from '@/components/ui/icons';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const metadata: Metadata = {
    title: 'Customers',
    description: 'Tahoe AI helps recruiting teams reduce sourcing busywork, preserve candidate context, and move from search to outreach faster.',
    alternates: {
        canonical: '/customers',
    },
    openGraph: {
        title: 'Customers | Tahoe AI',
        description: 'How recruiting teams use Tahoe AI for sourcing, enrichment, outreach, and analytics.',
        url: '/customers',
        siteName: 'Tahoe AI',
        images: OG_IMAGES,
        type: 'website',
    },
};

const customersJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Customers', item: `${SITE_URL}/customers` },
    ],
};

const segments = [
    ['Lean talent teams', 'Keep searches, shortlists, outreach, and spend visible when recruiter capacity is tight and every hour counts.'],
    ['Founder-led hiring', 'Turn a role brief into a focused audience and a first outreach sequence without buying a heavy enterprise stack.'],
    ['Recruiting agencies', 'Reduce context switching across sourcing, CRM notes, enrichment, and campaign follow-up for every client search.'],
];

const outcomes = [
    ['Less context switching', 'Sourcing, notes, enrichment, and follow-up live in one place, so the day stops being a tour of twelve browser tabs.'],
    ['Faster from brief to outreach', 'A role description becomes a focused audience and a first sequence in an afternoon, not across a fragmented week.'],
    ['Spend you can defend', 'Every credit maps to a search, an enrichment, or a send, so the budget conversation is short and honest.'],
];

const loop = [
    'Describe the role in plain words and turn it into a searchable, refinable audience.',
    'Save the right people into a project where their source and next action stay attached.',
    'Reveal verified contact details only for the candidates actually worth reaching.',
    'Send from your own mailbox and let replies, bounces, and suppressions track themselves.',
    'Watch what is working, then start the next search a little sharper than the last.',
];

const access = [
    ['Start free', 'Continue with Google or email, with no credit card and no sales call, and see your first results today.'],
    ['Pay for what you use', 'Credits cover enrichment and outreach, and the cost is shown before you ever spend it.'],
    ['Grow without a migration', 'The same workspace scales from a founder making first hires to a lean team running steady campaigns.'],
];

export default function CustomersPage() {
    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(customersJsonLd).replace(/</g, '\\u003c') }}
            />

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Customers</span>
                        <h1>Built for recruiters who need the work to stay connected.</h1>
                        <p>
                            Tahoe is useful for lean talent teams, founder-led hiring, agencies, and recruiting
                            operators who want sourcing, enrichment, outreach, and analytics in one calm workspace.
                        </p>
                    </div>
                    <div className={styles.testimonialGrid}>
                        {segments.map(([title, body]) => (
                            <article key={title} className={styles.testimonialCard}>
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
                        <span className={styles.sectionEyebrow}>Outcomes</span>
                        <h2>What changes when the work stays connected.</h2>
                        <p>
                            The difference is not one more feature. It is the friction that disappears when sourcing,
                            enrichment, and outreach stop living in separate tools.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {outcomes.map(([title, body]) => (
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
                        <span className={styles.sectionEyebrow}>How teams use Tahoe</span>
                        <h2>A simple loop that gets sharper each time.</h2>
                        <p>
                            Most teams settle into the same rhythm within a day. It is short on purpose, so it is easy to
                            repeat across every open role.
                        </p>
                    </div>
                    <div className={styles.checkList}>
                        {loop.map((line) => (
                            <span key={line}><CheckCircledIcon /> {line}</span>
                        ))}
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Honest by default</span>
                        <h2>No enterprise contract to get started.</h2>
                        <p>
                            You should be able to try the whole workflow before you talk to anyone, and only pay for the
                            work you actually run.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {access.map(([title, body]) => (
                            <article key={title} className={styles.featureCard}>
                                <h3>{title}</h3>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/signup" className={styles.primaryAction}>Start for free</Link>
                        <Link href="/contact" className={styles.ghostAction}>Contact Tahoe</Link>
                    </div>
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
