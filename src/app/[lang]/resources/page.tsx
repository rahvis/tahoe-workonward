import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { getResources } from '@/lib/resources';
import JsonLd from '@/components/seo/JsonLd';
import shared from '../blogs/blogs.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).resourceIndex;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/resources'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/resources`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

export default async function ResourcesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).resourceIndex;
    const L = (path: string) => `/${locale}${path}`;
    const resourceList = getResources(locale);

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Tahoe AI Resources',
            description: t.metaDescription,
            url: `${SITE_URL}/${locale}/resources`,
            publisher: { '@type': 'Organization', name: 'Tahoe AI', url: `${SITE_URL}/${locale}` },
            hasPart: resourceList.map((resource) => ({
                '@type': 'Article',
                headline: resource.title,
                url: `${SITE_URL}/${locale}/resources/${resource.slug}`,
                datePublished: resource.date,
                dateModified: resource.updated,
                description: resource.metaDescription,
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}` },
                { '@type': 'ListItem', position: 2, name: t.eyebrow, item: `${SITE_URL}/${locale}/resources` },
            ],
        },
    ];

    return (
        <main className={shared.page}>
            <PublicSiteHeader />
            <JsonLd data={jsonLd} />

            <section className={shared.hero}>
                <div className={shared.container}>
                    <div className={shared.eyebrow}>
                        <span className={shared.eyebrowDot} />
                        <span>{t.eyebrow}</span>
                    </div>
                    <h1>{t.h1}</h1>
                    <p>{t.lede}</p>
                </div>
            </section>

            <section className={shared.container} aria-label="Resources">
                <div className={shared.postGrid}>
                    {resourceList.map((resource) => (
                        <article key={resource.slug} className={shared.postCard}>
                            <div>
                                <div className={shared.postMeta}>
                                    <span>{resource.category}</span>
                                    <span>{resource.readingTime}</span>
                                </div>
                                <h2>
                                    <Link href={L(`/resources/${resource.slug}`)} className={shared.postLink}>
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
