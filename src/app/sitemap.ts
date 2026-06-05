import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-posts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

function absoluteUrl(path: string) {
    return new URL(path, siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: absoluteUrl('/'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: absoluteUrl('/product'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: absoluteUrl('/features'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: absoluteUrl('/pricing'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.95,
        },
        {
            url: absoluteUrl('/customers'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: absoluteUrl('/about'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: absoluteUrl('/contact'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: absoluteUrl('/blogs'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: absoluteUrl('/privacy'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: absoluteUrl('/cookie'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: absoluteUrl('/terms'),
            lastModified: new Date('2026-06-05T00:00:00.000Z'),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    const blogRoutes = blogPosts.map((post) => ({
        url: absoluteUrl(`/blogs/${post.slug}`),
        lastModified: new Date(`${post.updated}T00:00:00.000Z`),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [...staticRoutes, ...blogRoutes];
}
