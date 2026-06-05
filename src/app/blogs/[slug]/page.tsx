import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicSiteFooter, PublicSiteHeader } from '@/components/marketing/PublicSiteChrome';
import { blogPosts, getBlogPost, getRelatedBlogPosts } from '@/lib/blog-posts';
import styles from '../blogs.module.css';

type BlogPostPageProps = {
    params: Promise<{ slug: string }>;
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

export function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = getBlogPost(slug);
    if (!post) {
        return {
            title: 'Tahoe Blog',
        };
    }
    return {
        title: `${post.title} | Tahoe Blog`,
        description: post.summary,
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getBlogPost(slug);
    if (!post) {
        notFound();
    }
    const related = getRelatedBlogPosts(post.slug);

    return (
        <main className={styles.page}>
            <PublicSiteHeader />

            <article className={styles.article}>
                <div className={styles.container}>
                    <header className={styles.articleHeader}>
                        <Link href="/blogs" className={styles.backLink}>Back to blog</Link>
                        <div className={styles.articleMeta}>
                            <time dateTime={post.date}>{formatDate(post.date)}</time>
                            <span>{post.readingTime}</span>
                        </div>
                        <h1>{post.title}</h1>
                        <p className={styles.articleSummary}>{post.summary}</p>
                    </header>

                    <div className={styles.articleBody}>
                        <div className={styles.articleContent}>
                            {post.sections.map((section) => (
                                <section key={section.heading} className={styles.articleSection}>
                                    <h2>{section.heading}</h2>
                                    {section.body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </section>
                            ))}
                        </div>

                        <aside className={styles.aside} aria-label="Article context">
                            <div className={styles.asidePanel}>
                                <h2>Topics</h2>
                                <div className={styles.tagRow}>
                                    {post.tags.map((tag) => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.asidePanel}>
                                <h2>Latest from Tahoe</h2>
                                <div className={styles.relatedList}>
                                    {related.map((item) => (
                                        <Link key={item.slug} href={`/blogs/${item.slug}`} className={`${styles.postLink} ${styles.relatedItem}`}>
                                            <strong>{item.title}</strong>
                                            <span>{item.readingTime}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </article>
            <PublicSiteFooter />
        </main>
    );
}
