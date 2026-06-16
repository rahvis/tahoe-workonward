import type { Metadata } from 'next';
import Link from 'next/link';
import { OG_IMAGES } from '@/lib/og';
import { type Locale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { buildAlternates, buildOgLocale } from '@/i18n/metadata';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { getBlogPosts } from '@/lib/blog-posts';
import JsonLd from '@/components/seo/JsonLd';
import styles from './blogs.module.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>;
}): Promise<Metadata> {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).blogIndex;
    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: buildAlternates(locale, '/blogs'),
        openGraph: {
            title: `${t.metaTitle} | Tahoe AI`,
            description: t.ogDescription,
            url: `/${locale}/blogs`,
            siteName: 'Tahoe AI',
            images: OG_IMAGES,
            type: 'website',
            ...buildOgLocale(locale),
        },
    };
}

const POSTS_PER_PAGE = 9;

function parsePage(value: string | string[] | undefined, totalPages: number) {
    const pageValue = Array.isArray(value) ? value[0] : value;
    const requestedPage = Number.parseInt(pageValue ?? '1', 10);
    if (!Number.isFinite(requestedPage)) return 1;
    return Math.min(Math.max(requestedPage, 1), totalPages);
}

export default async function BlogsPage({
    params,
    searchParams,
}: {
    params: Promise<{ lang: string }>;
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    const { lang } = await params;
    const locale = (isLocale(lang) ? lang : 'en') as Locale;
    const t = (await getDictionary(locale)).blogIndex;
    const sp = await searchParams;
    const L = (path: string) => `/${locale}${path}`;
    const getPageHref = (page: number) => (page <= 1 ? L('/blogs') : L(`/blogs?page=${page}`));

    const posts = getBlogPosts(locale);
    const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
    const currentPage = parsePage(sp?.page, totalPages);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const visiblePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);
    const dateLocale = locale === 'ko' ? 'ko-KR' : 'en';

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Tahoe AI Blog',
            description: t.metaDescription,
            url: `${SITE_URL}/${locale}/blogs`,
            publisher: { '@type': 'Organization', name: 'Tahoe AI', url: `${SITE_URL}/${locale}` },
            blogPost: posts.map((post) => ({
                '@type': 'BlogPosting',
                headline: post.title,
                url: `${SITE_URL}/${locale}/blogs/${post.slug}`,
                datePublished: post.date,
                dateModified: post.updated,
                description: post.metaDescription,
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}` },
                { '@type': 'ListItem', position: 2, name: t.eyebrow, item: `${SITE_URL}/${locale}/blogs` },
            ],
        },
    ];

    return (
        <main className={styles.page}>
            <PublicSiteHeader />
            <JsonLd data={jsonLd} />

            <section className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.eyebrow}>
                        <span className={styles.eyebrowDot} />
                        <span>{t.eyebrow}</span>
                    </div>
                    <h1>{t.h1}</h1>
                    <p>{t.lede}</p>
                </div>
            </section>

            <section className={styles.container} aria-label="Blog posts">
                <div className={styles.postGrid}>
                    {visiblePosts.map((post) => (
                        <article key={post.slug} className={styles.postCard}>
                            <div>
                                <div className={styles.postMeta}>
                                    <time dateTime={post.date}>
                                        {new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${post.date}T00:00:00`))}
                                    </time>
                                    <span>{post.readingTime}</span>
                                </div>
                                <h2>
                                    <Link href={L(`/blogs/${post.slug}`)} className={styles.postLink}>
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
                    <span>{t.page} {currentPage} {t.of} {totalPages}</span>
                    <div className={styles.paginationActions}>
                        {currentPage > 1 ? (
                            <Link href={getPageHref(currentPage - 1)}>{t.previous}</Link>
                        ) : (
                            <span aria-disabled="true">{t.previous}</span>
                        )}
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <Link key={page} href={getPageHref(page)} aria-current={page === currentPage ? 'page' : undefined}>
                                {page}
                            </Link>
                        ))}
                        {currentPage < totalPages ? (
                            <Link href={getPageHref(currentPage + 1)}>{t.next}</Link>
                        ) : (
                            <span aria-disabled="true">{t.next}</span>
                        )}
                    </div>
                </nav>
            </section>

            <PublicSiteFooter />
        </main>
    );
}
