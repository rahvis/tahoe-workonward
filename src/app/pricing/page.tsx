import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import styles from '../page.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Tahoe AI pricing starts at $49 per month for AI recruiting search, candidate lists, contact enrichment workflows, outreach, and analytics.',
    alternates: {
        canonical: '/pricing',
    },
    openGraph: {
        title: 'Pricing | Tahoe AI',
        description: 'Simple AI recruiting software pricing with visible credits, enrichment costs, outreach, and analytics.',
        url: '/pricing',
        siteName: 'Tahoe AI',
        type: 'website',
    },
};

const pricingJsonLd = [
    {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Tahoe AI',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'AI recruiting software',
        operatingSystem: 'Web',
        url: `${SITE_URL}/pricing`,
        offers: {
            '@type': 'Offer',
            name: 'Growth plan',
            price: '49',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${SITE_URL}/pricing`,
            priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: '49',
                priceCurrency: 'USD',
                unitText: 'month',
            },
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE_URL}/pricing` },
        ],
    },
];

export default function PricingPage() {
    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd).replace(/</g, '\\u003c') }}
            />
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.pricingGrid}>
                        <div className={styles.pricingCopy}>
                            <span className={styles.sectionEyebrow}>Pricing</span>
                            <h1>AI recruiting software without enterprise-contract drag.</h1>
                            <p>
                                Tahoe starts at $49 per month. Recruiters get plain-English search, candidate lists,
                                visible credit movement, enrichment readiness, outreach sequencing, and analytics in
                                one workflow.
                            </p>
                            <Link href="/signup" className={styles.primaryAction}>Start free trial</Link>
                        </div>
                        <div className={styles.pricingCard}>
                            <div className={styles.pricingFeaturedRow}>
                                <div className={styles.featuredBrand}>Growth</div>
                                <div className={styles.barTrack}>
                                    <div className={styles.barFillAccent} style={{ width: '100%' }} />
                                </div>
                                <div className={styles.priceCell}>
                                    <strong>$49</strong>
                                    <span>/mo</span>
                                    <small>Cancel anytime</small>
                                </div>
                            </div>
                            {[
                                'Plain-English AI candidate search',
                                'Candidate lists and recruiting projects',
                                'Contact enrichment readiness workflows',
                                'Native outreach sequencing',
                                'Mailbox pacing and sender controls',
                                'Credit ledger and recruiting analytics',
                            ].map((item) => (
                                <div key={item} className={styles.detailLine}>{item}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
