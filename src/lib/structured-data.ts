// JSON-LD builders for SEO / AI-search entity recognition. No fabricated
// aggregateRating/reviews are emitted (protects E-E-A-T).
import type { Locale } from '@/i18n/config';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

const inLanguage = (lang: Locale) => (lang === 'ko' ? 'ko-KR' : 'en-US');

const SAME_AS = [
    'https://www.linkedin.com/company/workonward',
    'https://x.com/workonward',
    'https://www.facebook.com/workonward',
    'https://www.instagram.com/workonward',
    'https://www.youtube.com/@workonward',
];

export function organizationLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Tahoe AI',
        legalName: 'WorkOnward',
        url: SITE,
        logo: `${SITE}/icon.png`,
        description:
            'Tahoe is an AI recruiting platform by WorkOnward for natural-language candidate sourcing, contact enrichment, outreach, and analytics in one workflow.',
        sameAs: SAME_AS,
        contactPoint: {
            '@type': 'ContactPoint',
            email: 'info@workonward.com',
            contactType: 'customer support',
            availableLanguage: ['English', 'Korean'],
        },
    };
}

export function websiteLd(lang: Locale) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: 'Tahoe AI',
        url: `${SITE}/${lang}`,
        inLanguage: inLanguage(lang),
        publisher: { '@id': `${SITE}/#organization` },
    };
}

export function softwareApplicationLd(lang: Locale) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Tahoe AI',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'AI recruiting software',
        operatingSystem: 'Web',
        url: `${SITE}/${lang}`,
        inLanguage: inLanguage(lang),
        description:
            'AI recruiting software: describe who you are looking for in plain language, search 800M+ profiles, enrich verified contact details, and run outreach from your own inbox.',
        offers: {
            '@type': 'Offer',
            price: '49',
            priceCurrency: 'USD',
            description: 'Growth plan billed monthly. Free to start, no credit card required.',
        },
        publisher: { '@id': `${SITE}/#organization` },
    };
}

export function faqLd(faqs: ReadonlyArray<{ q: string; a: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };
}
