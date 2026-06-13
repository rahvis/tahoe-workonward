import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { getRelatedResources, getResource, resources, type ResourceBlock } from '@/lib/resources';
import shared from '../../blogs/blogs.module.css';
import styles from '../resources.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

type ResourcePageProps = {
    params: Promise<{ slug: string }>;
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function absoluteUrl(path: string) {
    return new URL(path, SITE_URL).toString();
}

function ResourceBlockView({ block }: { block: ResourceBlock }) {
    if (block.type === 'paragraph') {
        return <p>{block.text}</p>;
    }

    if (block.type === 'quote') {
        return (
            <blockquote className={styles.calloutQuote}>
                <p>{block.text}</p>
                {block.attribution ? <cite>{block.attribution}</cite> : null}
            </blockquote>
        );
    }

    if (block.type === 'example') {
        const tierClass =
            block.tier === 'Simple'
                ? styles.tierSimple
                : block.tier === 'Moderate'
                  ? styles.tierModerate
                  : styles.tierComplex;
        return (
            <div className={styles.example}>
                <span className={`${styles.tierChip} ${tierClass}`}>{block.tier}</span>
                <pre className={styles.promptBox}><code>{block.prompt}</code></pre>
                {block.note ? <p className={styles.exampleNote}>{block.note}</p> : null}
            </div>
        );
    }

    if (block.type === 'table') {
        return (
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    {block.caption ? <caption className={styles.tableCaption}>{block.caption}</caption> : null}
                    <thead>
                        <tr>
                            {block.headers.map((header, index) => (
                                <th key={index} scope="col">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {block.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // A checklist is a list whose items carry only a description (no term/number).
    const isChecklist = !block.ordered && block.items.every((item) => !item.term);
    if (isChecklist) {
        return (
            <ul className={styles.checklist}>
                {block.items.map((item, index) => (
                    <li key={index} className={styles.checklistItem}>{item.description}</li>
                ))}
            </ul>
        );
    }

    const ListTag = block.ordered ? 'ol' : 'ul';
    return (
        <ListTag className={`${styles.tipList} ${block.ordered ? styles.tipListOrdered : ''}`}>
            {block.items.map((item, index) => (
                <li key={index} className={styles.tipItem}>
                    {item.term ? <span className={styles.tipTerm}>{item.term}</span> : null}
                    {item.description}
                </li>
            ))}
        </ListTag>
    );
}

function buildResourceJsonLd(slug: string) {
    const resource = getResource(slug);
    if (!resource) {
        return [];
    }
    const url = absoluteUrl(`/resources/${resource.slug}`);

    return [
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: resource.title,
            description: resource.metaDescription,
            datePublished: resource.date,
            dateModified: resource.updated,
            image: absoluteUrl('/opengraph-image'),
            mainEntityOfPage: url,
            publisher: {
                '@type': 'Organization',
                name: 'Tahoe AI',
                url: absoluteUrl('/'),
                logo: {
                    '@type': 'ImageObject',
                    url: absoluteUrl('/logo/workonward_logo.svg'),
                },
            },
            keywords: resource.keywords.join(', '),
            about: resource.tags,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
                { '@type': 'ListItem', position: 2, name: 'Resources', item: absoluteUrl('/resources') },
                { '@type': 'ListItem', position: 3, name: resource.title, item: url },
            ],
        },
    ];
}

export function generateStaticParams() {
    return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
    const { slug } = await params;
    const resource = getResource(slug);
    if (!resource) {
        return { title: 'Tahoe Resources' };
    }
    const brandedTitle = `${resource.metaTitle} | Tahoe AI`;
    return {
        title: resource.metaTitle,
        description: resource.metaDescription,
        alternates: {
            canonical: `/resources/${resource.slug}`,
        },
        openGraph: {
            title: brandedTitle,
            description: resource.metaDescription,
            url: `/resources/${resource.slug}`,
            siteName: 'Tahoe AI',
            type: 'article',
            publishedTime: resource.date,
            modifiedTime: resource.updated,
            tags: resource.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: brandedTitle,
            description: resource.metaDescription,
        },
    };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
    const { slug } = await params;
    const resource = getResource(slug);
    if (!resource) {
        notFound();
    }
    const related = getRelatedResources(resource.slug);
    const jsonLd = buildResourceJsonLd(resource.slug);

    return (
        <main className={shared.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />

            <article className={shared.article}>
                <div className={shared.container}>
                    <header className={shared.articleHeader}>
                        <Link href="/resources" className={shared.backLink}>Back to resources</Link>
                        <div className={shared.articleMeta}>
                            <span>{resource.category}</span>
                            <time dateTime={resource.date}>{formatDate(resource.date)}</time>
                            <span>{resource.readingTime}</span>
                        </div>
                        <h1>{resource.title}</h1>
                        <p className={shared.articleSummary}>{resource.summary}</p>
                    </header>

                    <div className={shared.articleBody}>
                        <div className={shared.articleContent}>
                            <div className={styles.intro}>
                                {resource.intro.map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                            {resource.sections.map((section, sectionIndex) => (
                                <section key={sectionIndex} className={shared.articleSection}>
                                    <h2 className={styles.sectionHeading}>{section.heading}</h2>
                                    {section.blocks.map((block, blockIndex) => (
                                        <ResourceBlockView key={blockIndex} block={block} />
                                    ))}
                                </section>
                            ))}
                        </div>

                        <aside className={shared.aside} aria-label="Resource context">
                            <div className={shared.asidePanel}>
                                <h2>Topics</h2>
                                <div className={shared.tagRow}>
                                    {resource.tags.map((tag) => (
                                        <span key={tag} className={shared.tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                            {related.length > 0 ? (
                                <div className={shared.asidePanel}>
                                    <h2>More resources</h2>
                                    <div className={shared.relatedList}>
                                        {related.map((item) => (
                                            <Link key={item.slug} href={`/resources/${item.slug}`} className={`${shared.postLink} ${shared.relatedItem}`}>
                                                <strong>{item.title}</strong>
                                                <span>{item.readingTime}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </aside>
                    </div>
                </div>
            </article>
            <PublicSiteFooter />
        </main>
    );
}
