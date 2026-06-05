import { describe, expect, test, vi } from 'vitest';
import { redirect } from 'next/navigation';
import ArchivedProjectsRedirect from './page';

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

describe('ArchivedProjectsRedirect', () => {
    test('redirects archived project bookmarks to projects', () => {
        ArchivedProjectsRedirect();

        expect(redirect).toHaveBeenCalledWith('/dashboard/projects');
    });
});
