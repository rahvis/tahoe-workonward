import { describe, expect, test, vi } from 'vitest';
import { redirect } from 'next/navigation';
import OutreachRepliesRedirect from './page';

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

describe('OutreachRepliesRedirect', () => {
    test('redirects replies bookmarks to campaigns', () => {
        OutreachRepliesRedirect();

        expect(redirect).toHaveBeenCalledWith('/dashboard/outreach/campaigns');
    });
});
