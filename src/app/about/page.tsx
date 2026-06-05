import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const metadata: Metadata = {
    title: 'About',
    description: 'Tahoe AI is built by WorkOnward to help recruiters search, enrich, sequence, and analyze candidate workflows without losing context.',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        title: 'About | Tahoe AI',
        description: 'Learn about Tahoe AI, the recruiter operating system powered by WorkOnward.',
        url: '/about',
        siteName: 'Tahoe AI',
        type: 'website',
    },
};

const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
    ],
};

export default function AboutPage() {
    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd).replace(/</g, '\\u003c') }}
            />
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>About</span>
                        <h1>Tahoe AI is powered by WorkOnward.</h1>
                        <p>
                            Tahoe exists to make recruiting workflows more inspectable: plain-English sourcing,
                            candidate lists, contact enrichment, native outreach, visible credits, and analytics that
                            point back to real work.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        {[
                            ['Experience', 'We design around the repeated daily work recruiters do: searching, saving, enriching, sequencing, and reporting.'],
                            ['Expertise', 'Tahoe content and product surfaces are grounded in recruiting operations, sender health, sourcing benchmarks, and AI governance.'],
                            ['Trust', 'The workflow exposes source context, spend, sender limits, suppression state, and source citations instead of hiding decisions behind automation.'],
                        ].map(([title, body]) => (
                            <article key={title} className={styles.featureCard}>
                                <h2>{title}</h2>
                                <p>{body}</p>
                            </article>
                        ))}
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/blogs" className={styles.primaryAction}>Read the blog</Link>
                        <Link href="/contact" className={styles.ghostAction}>Contact us</Link>
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
