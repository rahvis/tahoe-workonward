import { render, screen, within } from '@testing-library/react';
import { blogPosts } from '@/lib/blog-posts';
import BlogsPage from './page';

test('renders the Tahoe blog index with only the active post', async () => {
    const ui = await BlogsPage({ searchParams: Promise.resolve({}) });

    render(ui);

    expect(
        screen.getByRole('heading', { name: /recruiting workflows, written plainly/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^blog$/i }).some((link) => link.getAttribute('href') === '/blogs')).toBe(true);
    expect(screen.getByText(/made for recruiters who would rather hire than negotiate contracts/i)).toBeInTheDocument();

    expect(screen.getAllByRole('article')).toHaveLength(blogPosts.length);

    blogPosts.forEach((post) => {
        const heading = screen.getByRole('heading', { name: post.title });
        const card = heading.closest('article');

        expect(card).not.toBeNull();
        expect(within(card as HTMLElement).getByRole('link', { name: post.title })).toHaveAttribute(
            'href',
            `/blogs/${post.slug}`,
        );
        expect(screen.getByText(post.summary)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/blog pagination/i)).toHaveTextContent('Page 1 of 1');
    expect(screen.queryByRole('link', { name: /^next$/i })).not.toBeInTheDocument();
});

test('clamps out-of-range blog index pages to the single available page', async () => {
    const ui = await BlogsPage({ searchParams: Promise.resolve({ page: '2' }) });

    render(ui);

    expect(screen.getAllByRole('article')).toHaveLength(blogPosts.length);

    blogPosts.forEach((post) => {
        expect(screen.getByRole('heading', { name: post.title })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/blog pagination/i)).toHaveTextContent('Page 1 of 1');
    expect(screen.queryByRole('link', { name: /^previous$/i })).not.toBeInTheDocument();
});
