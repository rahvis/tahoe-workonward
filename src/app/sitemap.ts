import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-posts';
import { resources } from '@/lib/resources';
import { locales } from '@/i18n/config';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

function abs(path: string) {
    return new URL(path, siteUrl).toString();
}

// hreflang alternates (+ x-default -> en) for a locale-agnostic path.
function languages(path: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const l of locales) out[l] = abs(`/${l}${path}`);
    out['x-default'] = abs(`/en${path}`);
    return out;
}

// One <url> entry per locale, each carrying the full hreflang map.
function entries(
    path: string,
    opts: {
        lastModified: Date;
        changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
        priority: number;
    },
): MetadataRoute.Sitemap {
    const langs = languages(path);
    return locales.map((l) => ({
        url: abs(`/${l}${path}`),
        lastModified: opts.lastModified,
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates: { languages: langs },
    }));
}

export default function sitemap(): MetadataRoute.Sitemap {
    const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

    const marketing: Array<
        [string, string, MetadataRoute.Sitemap[number]['changeFrequency'], number]
    > = [
        ['', '2026-06-15', 'weekly', 1],
        ['/product', '2026-06-15', 'monthly', 0.9],
        ['/features', '2026-06-15', 'monthly', 0.9],
        ['/hiring', '2026-06-18', 'monthly', 0.9],
        ['/pricing', '2026-06-15', 'monthly', 0.95],
        ['/customers', '2026-06-15', 'monthly', 0.7],
        ['/our-story', '2026-06-15', 'monthly', 0.7],
        ['/partner', '2026-06-15', 'monthly', 0.6],
        ['/about', '2026-06-05', 'yearly', 0.5],
        ['/contact', '2026-06-05', 'yearly', 0.5],
        ['/blogs', '2026-06-15', 'weekly', 0.9],
        ['/resources', '2026-06-13', 'weekly', 0.7],
        ['/privacy', '2026-06-05', 'yearly', 0.3],
        ['/cookie', '2026-06-05', 'yearly', 0.3],
        ['/terms', '2026-06-05', 'yearly', 0.3],
    ];

    const staticEntries = marketing.flatMap(([path, mod, freq, priority]) =>
        entries(path, { lastModified: d(mod), changeFrequency: freq, priority }),
    );

    const blogEntries = blogPosts.flatMap((post) =>
        entries(`/blogs/${post.slug}`, {
            lastModified: d(post.updated),
            changeFrequency: 'monthly',
            priority: 0.8,
        }),
    );

    const resourceEntries = resources.flatMap((resource) =>
        entries(`/resources/${resource.slug}`, {
            lastModified: d(resource.updated),
            changeFrequency: 'monthly',
            priority: 0.7,
        }),
    );

    return [...staticEntries, ...blogEntries, ...resourceEntries];
}
