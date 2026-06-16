import { describe, expect, test, vi } from 'vitest';
import { redirect } from 'next/navigation';
import BlogRedirectPage from './page';

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

describe('BlogRedirectPage', () => {
    test('redirects singular blog route to blogs', () => {
        BlogRedirectPage();

        expect(redirect).toHaveBeenCalledWith('/blogs');
    });
});

