import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tahoe AI — AI Recruiting Search and Outreach',
        short_name: 'Tahoe AI',
        description:
            'AI recruiting platform for natural-language candidate sourcing, contact enrichment, outreach, and analytics.',
        start_url: '/en',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ff682c',
        icons: [
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
