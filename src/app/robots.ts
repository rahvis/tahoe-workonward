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

// Keep the authenticated app and the auth screens out of the index, in both
// locales. Marketing, blog, and resource content stays fully crawlable.
const authAndAppPaths = [
    '/dashboard',
    '/*/login',
    '/*/signup',
    '/*/forgot-password',
    '/*/reset-password',
    '/*/verify-email',
    '/*/resend-verification',
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: authAndAppPaths,
            },
            {
                userAgent: aiAndSearchCrawlers,
                allow: '/',
                disallow: authAndAppPaths,
            },
        ],
        host: siteUrl,
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
