import type { Metadata } from 'next';
import { OG_IMAGES } from '@/lib/og';
import Link from 'next/link';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { blogPosts } from '@/lib/blog-posts';
import styles from './blogs.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';
const BLOG_DESCRIPTION = 'Research-backed Tahoe articles on AI sourcing, candidate lists, enrichment, outreach, mailbox health, and recruiting analytics.';

export const metadata: Metadata = {
    title: 'AI Recruiting Blog',
    description: BLOG_DESCRIPTION,
    alternates: {
        canonical: '/blogs',
    },
    openGraph: {
        title: 'AI Recruiting Blog | Tahoe AI',
        description: 'Research-backed articles on AI sourcing, outreach, enrichment, and recruiting operations.',
        url: '/blogs',
        siteName: 'Tahoe AI',
        images: OG_IMAGES,
        type: 'website',
    },
};

function absoluteUrl(path: string) {
    return new URL(path, SITE_URL).toString();
}

function buildBlogIndexJsonLd() {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Tahoe AI Blog',
            description: BLOG_DESCRIPTION,
            url: absoluteUrl('/blogs'),
            publisher: {
                '@type': 'Organization',
                name: 'Tahoe AI',
                url: absoluteUrl('/'),
                logo: {
                    '@type': 'ImageObject',
                    url: absoluteUrl('/logo/workonward_logo.svg'),
                },
            },
            blogPost: blogPosts.map((post) => ({
                '@type': 'BlogPosting',
                headline: post.title,
                url: absoluteUrl(`/blogs/${post.slug}`),
                datePublished: post.date,
                dateModified: post.updated,
                description: post.metaDescription,
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
                    name: 'Blog',
                    item: absoluteUrl('/blogs'),
                },
            ],
        },
    ];
}

const POSTS_PER_PAGE = 9;

type BlogsPageProps = {
    searchParams?: Promise<{
        page?: string | string[];
    }>;
};

function getPageHref(page: number) {
    return page <= 1 ? '/blogs' : `/blogs?page=${page}`;
}

function parsePage(value: string | string[] | undefined, totalPages: number) {
    const pageValue = Array.isArray(value) ? value[0] : value;
    const requestedPage = Number.parseInt(pageValue ?? '1', 10);
    if (!Number.isFinite(requestedPage)) {
        return 1;
    }
    return Math.min(Math.max(requestedPage, 1), totalPages);
}

export default async function BlogsPage({ searchParams }: BlogsPageProps = {}) {
    const params = await searchParams;
    const totalPages = Math.max(1, Math.ceil(blogPosts.length / POSTS_PER_PAGE));
    const currentPage = parsePage(params?.page, totalPages);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const visiblePosts = blogPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBlogIndexJsonLd()).replace(/</g, '\\u003c') }}
            />

            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.eyebrow}>
                        <span className={styles.eyebrowDot} />
                        <span>Tahoe blog</span>
                    </div>
                    <h1>Recruiting workflows, written plainly.</h1>
                    <p>
                        Product notes on sourcing, candidate lists, enrichment, outreach, analytics, and the operating
                        details that make recruiting teams faster.
                    </p>
                </div>
            </section>

            <section className={styles.container} aria-label="Blog posts">
                <div className={styles.postGrid}>
                    {visiblePosts.map((post) => (
                        <article key={post.slug} className={styles.postCard}>
                            <div>
                                <div className={styles.postMeta}>
                                    <time dateTime={post.date}>
                                        {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${post.date}T00:00:00`))}
                                    </time>
                                    <span>{post.readingTime}</span>
                                </div>
                                <h2>
                                    <Link href={`/blogs/${post.slug}`} className={styles.postLink}>
                                        {post.title}
                                    </Link>
                                </h2>
                                <p>{post.summary}</p>
                            </div>
                            <div className={styles.tagRow}>
                                {post.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <nav className={styles.pagination} aria-label="Blog pagination">
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className={styles.paginationActions}>
                        {currentPage > 1 ? (
                            <Link href={getPageHref(currentPage - 1)}>Previous</Link>
                        ) : (
                            <span aria-disabled="true">Previous</span>
                        )}
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <Link
                                key={page}
                                href={getPageHref(page)}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </Link>
                        ))}
                        {currentPage < totalPages ? (
                            <Link href={getPageHref(currentPage + 1)}>Next</Link>
                        ) : (
                            <span aria-disabled="true">Next</span>
                        )}
                    </div>
                </nav>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
