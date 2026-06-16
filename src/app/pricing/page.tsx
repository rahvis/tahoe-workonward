import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
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
        images: OG_IMAGES,
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
                            <h1>Recruiter-grade tools without the enterprise contract.</h1>
                            <p>
                                Tahoe starts at $49 per month. You get search in your own words, candidate lists, clear
                                credit costs, contact enrichment, outreach, and analytics in one workflow.
                            </p>
                            <Link href="/signup" className={styles.primaryAction}>Start for free</Link>
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
                                'Search candidates in your own words',
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
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHead}>
                        <span className={styles.sectionEyebrow}>Pricing FAQ</span>
                        <h2>Questions about credits and billing</h2>
                    </div>
                    <div className={styles.featureGrid}>
                        {[
                            ['What is a credit?', 'Credits cover the work Tahoe does for you. Search credits run your candidate searches, and enrich credits find verified emails and phone numbers. You always see the cost before you spend.'],
                            ['Do unused credits roll over?', 'Each plan includes a fresh monthly allowance. Unused credits do not roll over, so you start every month with your full balance.'],
                            ['Do I pay extra to send outreach?', 'No. Outreach sends from your own inbox, so there is no separate sending charge.'],
                            ['Can I start without a credit card?', 'Yes. Start for free with Google or email, run your first search, and add a card only when you are ready.'],
                        ].map(([question, answer]) => (
                            <article key={question} className={styles.featureCard}>
                                <h3>{question}</h3>
                                <p>{answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            <PublicSiteFooter />
        </main>
    );
}
