import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
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
                        {[
                            ['Lean talent teams', 'Keep searches, shortlists, outreach, and spend visible when recruiter capacity is tight.'],
                            ['Founder-led hiring', 'Turn a role brief into a focused audience without buying a heavy enterprise stack.'],
                            ['Recruiting agencies', 'Reduce context switching across sourcing, CRM notes, enrichment, and campaign follow-up.'],
                        ].map(([title, body]) => (
                            <article key={title} className={styles.testimonialCard}>
                                <h2>{title}</h2>
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
