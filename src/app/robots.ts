import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahoe.workonward.com';

const aiAndSearchCrawlers = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Googlebot',
    'Google-Extended',
    'GoogleOther',
    'GoogleOther-Image',
    'GoogleOther-Video',
    'Google-CloudVertexBot',
    'Bingbot',
    'BingPreview',
    'DuckDuckBot',
    'DuckAssistBot',
    'Applebot',
    'Applebot-Extended',
    'CCBot',
    'Bytespider',
    'Amazonbot',
    'FacebookBot',
    'Meta-ExternalAgent',
    'Meta-ExternalFetcher',
    'YouBot',
    'cohere-ai',
    'SemrushBot',
    'AhrefsBot',
    'MJ12bot',
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
            },
            {
                userAgent: aiAndSearchCrawlers,
                allow: '/',
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
