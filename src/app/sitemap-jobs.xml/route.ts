// Auto-generated sitemap of published jobs. Reflects publish/close automatically
// (queries the live public board, paginated) and is revalidated periodically.
import { fetchBoard } from '@/lib/public-jobs';

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://tahoe.workonward.com';

export async function GET() {
    const slugs: Array<{ slug: string; lastmod: string | null }> = [];
    let cursor: string | undefined;
    for (let page = 0; page < 50; page += 1) {
        const board = await fetchBoard({ cursor }).catch(() => ({ items: [], next_cursor: null }));
        for (const j of board.items) slugs.push({ slug: j.slug, lastmod: j.published_at });
        if (!board.next_cursor) break;
        cursor = board.next_cursor;
    }

    const urls = slugs
        .map(({ slug, lastmod }) => {
            const loc = `${SITE}/jobs/${slug}`;
            const lm = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
            return `  <url><loc>${loc}</loc>${lm}</url>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    return new Response(xml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
}
