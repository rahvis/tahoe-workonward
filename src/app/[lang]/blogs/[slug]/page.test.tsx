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
            params: Promise.resolve({ slug: 'big-tech-firing-and-hiring-2026' }),
        });

        render(ui);

        expect(
            screen.getByRole('heading', {
                name: /big tech is firing and hiring at the same time/i,
            }),
        ).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /^blog$/i }).some((link) => link.getAttribute('href') === '/blogs')).toBe(true);
        expect(screen.getByRole('link', { name: /back to blog/i })).toHaveAttribute('href', '/blogs');
        expect(screen.getAllByText(/big tech/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('img', { name: /big tech cuts, hires, and reshuffles/i })).toBeInTheDocument();
        expect(screen.getByText(/sources: challenger, gray & christmas may 2026; comptia 2026 tech workforce reports/i)).toBeInTheDocument();
        expect(screen.getByText(/the big tech job market in 2026 is not one story/i)).toBeInTheDocument();
        expect(screen.getByText(/the labor market is being reshaped by technology in real time/i)).toBeInTheDocument();
        expect(screen.queryByText(/by dheerendra panwar and holly oh diamond/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /authors/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /dheerendra panwar/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /holly oh diamond/i })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /sources/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /may 2026 job cut announcement report/i })).toHaveAttribute(
            'href',
            expect.stringContaining('challengergray.com'),
        );
        expect(screen.queryByRole('heading', { name: /latest from tahoe/i })).not.toBeInTheDocument();
        expect(screen.getByText(/made for recruiters who would rather hire than negotiate contracts/i)).toBeInTheDocument();
    });

    test('generates static params and metadata for blog posts', async () => {
        expect(generateStaticParams()).toEqual([{ slug: 'big-tech-firing-and-hiring-2026' }]);

        await expect(
            generateMetadata({ params: Promise.resolve({ slug: 'big-tech-firing-and-hiring-2026' }) }),
        ).resolves.toMatchObject({
            title: 'Big Tech layoffs and hiring in 2026',
            description: expect.stringContaining('Big Tech layoffs'),
        });
    });

    test('renders notFound for an unknown blog slug', async () => {
        await expect(
            BlogPostPage({ params: Promise.resolve({ slug: 'missing-post' }) }),
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(notFound).toHaveBeenCalled();
    });
});
