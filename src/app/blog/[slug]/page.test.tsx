import { describe, expect, test, vi } from 'vitest';
import { redirect } from 'next/navigation';
import BlogSlugRedirectPage from './page';

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

describe('BlogSlugRedirectPage', () => {
    test('redirects singular blog post route to plural blogs route', async () => {
        await BlogSlugRedirectPage({
            params: Promise.resolve({ slug: 'from-search-to-outreach' }),
        });

        expect(redirect).toHaveBeenCalledWith('/blogs/from-search-to-outreach');
    });
});

