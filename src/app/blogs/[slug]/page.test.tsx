import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { describe, expect, test, vi } from 'vitest';
import BlogPostPage, { generateMetadata, generateStaticParams } from './page';

vi.mock('next/navigation', () => ({
    notFound: vi.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
}));

describe('BlogPostPage', () => {
    test('renders a Tahoe blog article with metadata, sections, tags, and back link', async () => {
        const ui = await BlogPostPage({
            params: Promise.resolve({ slug: 'from-search-to-outreach' }),
        });

        render(ui);

        expect(
            screen.getByRole('heading', {
                name: /from search to outreach without losing recruiter context/i,
            }),
        ).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /^blog$/i }).some((link) => link.getAttribute('href') === '/blogs')).toBe(true);
        expect(screen.getByRole('link', { name: /back to blog/i })).toHaveAttribute('href', '/blogs');
        expect(screen.getAllByText(/workflow/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('heading', { name: /the handoff is the workflow/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /latest from tahoe/i })).toBeInTheDocument();
        expect(screen.getByText(/made for recruiters who would rather hire than negotiate contracts/i)).toBeInTheDocument();
    });

    test('generates static params and metadata for blog posts', async () => {
        expect(generateStaticParams()).toContainEqual({ slug: 'from-search-to-outreach' });

        await expect(
            generateMetadata({ params: Promise.resolve({ slug: 'from-search-to-outreach' }) }),
        ).resolves.toMatchObject({
            title: expect.stringContaining('From search to outreach'),
        });
    });

    test('renders notFound for an unknown blog slug', async () => {
        await expect(
            BlogPostPage({ params: Promise.resolve({ slug: 'missing-post' }) }),
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(notFound).toHaveBeenCalled();
    });
});
