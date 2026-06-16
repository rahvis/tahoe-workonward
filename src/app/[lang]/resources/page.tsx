import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { resources } from '@/lib/resources';
import shared from '../blogs/blogs.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';
const RESOURCES_DESCRIPTION =
    'Tahoe resources: practical guides, tips, and playbooks for getting the most out of AI sourcing, search, enrichment, and outreach.';

export const metadata: Metadata = {
    title: 'Resources',
    description: RESOURCES_DESCRIPTION,
    alternates: {
        canonical: '/resources',
    },
    openGraph: {
        title: 'Resources | Tahoe AI',
        description: RESOURCES_DESCRIPTION,
        url: '/resources',
        siteName: 'Tahoe AI',
        images: OG_IMAGES,
        type: 'website',
    },
};

function absoluteUrl(path: string) {
    return new URL(path, SITE_URL).toString();
}

function buildResourcesJsonLd() {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Tahoe AI Resources',
            description: RESOURCES_DESCRIPTION,
            url: absoluteUrl('/resources'),
            publisher: {
                '@type': 'Organization',
                name: 'Tahoe AI',
                url: absoluteUrl('/'),
                logo: {
                    '@type': 'ImageObject',
                    url: absoluteUrl('/logo/workonward_logo.svg'),
                },
            },
            hasPart: resources.map((resource) => ({
                '@type': 'Article',
                headline: resource.title,
                url: absoluteUrl(`/resources/${resource.slug}`),
                datePublished: resource.date,
                dateModified: resource.updated,
                description: resource.metaDescription,
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: absoluteUrl('/'),
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Resources',
                    item: absoluteUrl('/resources'),
                },
            ],
        },
    ];
}

export default function ResourcesPage() {
    return (
        <main className={shared.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildResourcesJsonLd()).replace(/</g, '\\u003c') }}
            />

            <section className={shared.hero}>
                <div className={shared.container}>
                    <div className={shared.eyebrow}>
                        <span className={shared.eyebrowDot} />
                        <span>Tahoe resources</span>
                    </div>
                    <h1>Guides to get more out of Tahoe.</h1>
                    <p>
                        Practical playbooks and tips for sourcing, search, enrichment, and outreach, written so you can
                        put them to work in your next search.
                    </p>
                </div>
            </section>

            <section className={shared.container} aria-label="Resources">
                <div className={shared.postGrid}>
                    {resources.map((resource) => (
                        <article key={resource.slug} className={shared.postCard}>
                            <div>
                                <div className={shared.postMeta}>
                                    <span>{resource.category}</span>
                                    <span>{resource.readingTime}</span>
                                </div>
                                <h2>
                                    <Link href={`/resources/${resource.slug}`} className={shared.postLink}>
                                        {resource.title}
                                    </Link>
                                </h2>
                                <p>{resource.summary}</p>
                            </div>
                            <div className={shared.tagRow}>
                                {resource.tags.map((tag) => (
                                    <span key={tag} className={shared.tag}>{tag}</span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
