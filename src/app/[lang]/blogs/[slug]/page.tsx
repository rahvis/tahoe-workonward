import type { Metadata } from 'next';
import { OG_IMAGES, OG_IMAGE_URL } from '@/lib/og';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { getBlogPosts, getBlogPost, getRelatedBlogPosts, type BlogPost } from '@/lib/blog-posts';
import { type Locale, isLocale } from '@/i18n/config';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import styles from '../blogs.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

type BlogPostPageProps = {
    params: Promise<{ slug: string; lang: string }>;
};

const ARTICLE_UI = {
    en: { backToBlog: 'Back to blog', topics: 'Topics', sources: 'Sources', latest: 'Latest from Tahoe', home: 'Home', blog: 'Blog' },
    ko: { backToBlog: '블로그로 돌아가기', topics: '주제', sources: '출처', latest: 'Tahoe 최신 글', home: '홈', blog: '블로그' },
} as const;

function formatDate(date: string, locale: Locale) {
    const intlLocale = locale === 'ko' ? 'ko-KR' : 'en';
    return new Intl.DateTimeFormat(intlLocale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function absoluteUrl(path: string) {
    return new URL(path, SITE_URL).toString();
}

function splitSvgText(text: string, maxLength = 48) {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    words.forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > maxLength && current) {
            lines.push(current);
            current = word;
        } else {
            current = next;
        }
    });

    if (current) {
        lines.push(current);
    }

    return lines.slice(0, 3);
}

function BlogInfographicFigure({ post }: { post: BlogPost }) {
    const titleId = `${post.slug}-infographic-title`;
    const descriptionId = `${post.slug}-infographic-description`;
    const metricPositions = [82, 424, 766];

    return (
        <figure className={styles.infographicFigure}>
            <svg
                className={styles.infographicSvg}
                viewBox="0 0 1200 820"
                role="img"
                aria-labelledby={`${titleId} ${descriptionId}`}
            >
                <rect width="1200" height="820" fill="#ffffff" />
                <rect x="70" y="50" width="1060" height="3" fill="#1e1e1e" />
                <text x="70" y="98" fill="#b0851c" fontFamily="Montserrat, Arial, sans-serif" fontSize="15" fontWeight="500" letterSpacing="3">
                    {post.infographic.kicker}
                </text>
                <text id={titleId} x="70" y="154" fill="#1e1e1e" fontFamily="Montserrat, Arial, sans-serif" fontSize="38" fontWeight="500">
                    {post.infographic.headline}
                </text>
                <text id={descriptionId} x="70" y="202" fill="#5a5a5a" fontFamily="Montserrat, Arial, sans-serif" fontSize="18">
                    {splitSvgText(post.infographic.deck, 96).map((line, index) => (
                        <tspan key={line} x="70" dy={index === 0 ? 0 : 26}>
                            {line}
                        </tspan>
                    ))}
                </text>
                <line x1="70" y1="256" x2="1130" y2="256" stroke="#e5e5e5" strokeWidth="1" />

                {post.infographic.metrics.slice(0, 3).map((metric, index) => {
                    const x = metricPositions[index] ?? 82;
                    return (
                        <g key={metric.label}>
                            <rect x={x - 2} y="300" width="286" height="190" rx="8" fill="#fbfaf7" stroke="#e7e2da" />
                            <text x={x + 22} y="362" fill="#2f6486" fontFamily="Montserrat, Arial, sans-serif" fontSize="56" fontWeight="500">
                                {metric.value}
                            </text>
                            <text x={x + 22} y="406" fill="#1e1e1e" fontFamily="Montserrat, Arial, sans-serif" fontSize="19" fontWeight="500">
                                {metric.label}
                            </text>
                            {splitSvgText(metric.detail, 28).map((line, lineIndex) => (
                                <text
                                    key={line}
                                    x={x + 22}
                                    y={438 + lineIndex * 23}
                                    fill="#5a5a5a"
                                    fontFamily="Montserrat, Arial, sans-serif"
                                    fontSize="15"
                                >
                                    {line}
                                </text>
                            ))}
                        </g>
                    );
                })}

                <text x="70" y="544" fill="#1e1e1e" fontFamily="Montserrat, Arial, sans-serif" fontSize="18" fontWeight="500">
                    Operating readout
                </text>
                <line x1="70" y1="568" x2="1130" y2="568" stroke="#e5e5e5" strokeWidth="1" />
                {post.infographic.rows.slice(0, 3).map((row, index) => {
                    const y = 610 + index * 52;
                    const barWidth = Math.max(8, Math.min(100, row.bar)) * 3.25;
                    return (
                        <g key={row.label}>
                            <text x="70" y={y} fill="#1e1e1e" fontFamily="Montserrat, Arial, sans-serif" fontSize="16" fontWeight="500">
                                {row.label}
                            </text>
                            <text x="230" y={y} fill="#2f6486" fontFamily="Montserrat, Arial, sans-serif" fontSize="16" fontWeight="500">
                                {row.value}
                            </text>
                            <rect x="350" y={y - 15} width="330" height="16" rx="8" fill="#efefef" />
                            <rect x="350" y={y - 15} width={barWidth} height="16" rx="8" fill="#ff682c" />
                            <text x="710" y={y} fill="#5a5a5a" fontFamily="Montserrat, Arial, sans-serif" fontSize="15">
                                {splitSvgText(row.note, 54).map((line, lineIndex) => (
                                    <tspan key={line} x="710" dy={lineIndex === 0 ? 0 : 20}>
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        </g>
                    );
                })}

                <line x1="70" y1="754" x2="1130" y2="754" stroke="#e5e5e5" strokeWidth="1" />
                <text x="70" y="786" fill="#9a9a9a" fontFamily="Montserrat, Arial, sans-serif" fontSize="13">
                    {post.infographic.source}
                </text>
            </svg>
        </figure>
    );
}

function buildArticleJsonLd(post: BlogPost, locale: Locale) {
    const ui = ARTICLE_UI[locale];
    const url = absoluteUrl(`/${locale}/blogs/${post.slug}`);

    return [
        {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.date,
            dateModified: post.updated,
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
            keywords: post.keywords.join(', '),
            about: post.tags,
            citation: post.citations.map((citation) => citation.url),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: ui.home,
                    item: absoluteUrl(`/${locale}`),
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: ui.blog,
                    item: absoluteUrl(`/${locale}/blogs`),
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: post.title,
                    item: url,
                },
            ],
        },
    ];
}

export function generateStaticParams() {
    return getBlogPosts('en').map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug, lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const post = getBlogPost(locale, slug);
    if (!post) {
        return {
            title: 'Tahoe Blog',
        };
    }
    const brandedTitle = `${post.metaTitle} | Tahoe AI`;
    return {
        title: post.metaTitle,
        description: post.metaDescription,
        alternates: buildAlternates(locale, `/blogs/${post.slug}`),
        openGraph: {
            title: brandedTitle,
            description: post.metaDescription,
            url: `/${locale}/blogs/${post.slug}`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'article',
            publishedTime: post.date,
            modifiedTime: post.updated,
            tags: post.tags,
            ...buildOgLocale(locale),
        },
        twitter: {
            card: 'summary_large_image',
            images: [OG_IMAGE_URL],
            title: brandedTitle,
            description: post.metaDescription,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug, lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const ui = ARTICLE_UI[locale];
    const L = (path: string) => `/${locale}${path}`;
    const post = getBlogPost(locale, slug);
    if (!post) {
        notFound();
    }
    const related = getRelatedBlogPosts(locale, post.slug);
    const jsonLd = buildArticleJsonLd(post, locale);

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />

            <article className={styles.article}>
                <div className={styles.container}>
                    <header className={styles.articleHeader}>
                        <Link href={L('/blogs')} className={styles.backLink}>{ui.backToBlog}</Link>
                        <div className={styles.articleMeta}>
                            <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                            <span>{post.readingTime}</span>
                        </div>
                        <h1>{post.title}</h1>
                        <p className={styles.articleSummary}>{post.summary}</p>
                    </header>

                    <div className={styles.articleBody}>
                        <div className={styles.articleContent}>
                            <BlogInfographicFigure post={post} />
                            {post.sections.map((section, sectionIndex) => (
                                <section key={`${post.slug}-section-${sectionIndex}`} className={styles.articleSection}>
                                    {section.body.map((paragraph, paragraphIndex) => (
                                        <p key={`${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>
                                    ))}
                                    {section.quote ? (
                                        <blockquote className={styles.articleQuote}>
                                            <p>{section.quote.text}</p>
                                            <cite>{section.quote.attribution}</cite>
                                        </blockquote>
                                    ) : null}
                                </section>
                            ))}
                        </div>

                        <aside className={styles.aside} aria-label="Article context">
                            <div className={styles.asidePanel}>
                                <h2>{ui.topics}</h2>
                                <div className={styles.tagRow}>
                                    {post.tags.map((tag) => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.asidePanel}>
                                <h2>{ui.sources}</h2>
                                <div className={styles.sourceList}>
                                    {post.citations.map((citation) => (
                                        <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer" className={styles.sourceItem}>
                                            <strong>{citation.label}</strong>
                                            <span>{citation.source}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                            {related.length > 0 ? (
                                <div className={styles.asidePanel}>
                                    <h2>{ui.latest}</h2>
                                    <div className={styles.relatedList}>
                                        {related.map((item) => (
                                            <Link key={item.slug} href={L(`/blogs/${item.slug}`)} className={`${styles.postLink} ${styles.relatedItem}`}>
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
