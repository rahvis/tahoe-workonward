import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const metadata: Metadata = {
    title: 'Contact',
    description: 'Contact Tahoe AI by WorkOnward for AI recruiting software questions, product feedback, partnership requests, and support.',
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        title: 'Contact | Tahoe AI',
        description: 'Get in touch with Tahoe AI for recruiting software, partnership, and support questions.',
        url: '/contact',
        siteName: 'Tahoe AI',
        type: 'website',
    },
};

const contactJsonLd = [
    {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Tahoe AI',
        url: `${SITE_URL}/contact`,
        mainEntity: {
            '@type': 'Organization',
            name: 'Tahoe AI',
            email: 'info@workonward.com',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '124 E 14th St',
                addressLocality: 'New York',
                addressRegion: 'NY',
                postalCode: '10003',
                addressCountry: 'US',
            },
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
        ],
    },
];

export default function ContactPage() {
    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd).replace(/</g, '\\u003c') }}
            />
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Contact</span>
                        <h1>Talk to Tahoe AI.</h1>
                        <p>
                            Questions about AI recruiting software, candidate sourcing, enrichment, outreach,
                            partnerships, or support can go to the WorkOnward team.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        <article className={styles.featureCard}>
                            <h2>Email</h2>
                            <p><a href="mailto:info@workonward.com">info@workonward.com</a></p>
                        </article>
                        <article className={styles.featureCard}>
                            <h2>Mailing address</h2>
                            <p>WorkOnward, 124 E 14th St, New York, NY 10003</p>
                        </article>
                        <article className={styles.featureCard}>
                            <h2>Partnerships</h2>
                            <p>Recruiting operators, content partners, and affiliates can apply through the partner program.</p>
                        </article>
                    </div>
                    <div className={styles.heroActions}>
                        <Link href="/partner" className={styles.primaryAction}>Partner program</Link>
                        <Link href="/signup" className={styles.ghostAction}>Start for free</Link>
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
