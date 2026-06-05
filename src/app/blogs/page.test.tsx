import { render, screen, within } from '@testing-library/react';
import { blogPosts } from '@/lib/blog-posts';
import BlogsPage from './page';

test('renders the Tahoe blog index as a paginated 3 by 3 grid', async () => {
    const ui = await BlogsPage({ searchParams: Promise.resolve({}) });

    render(ui);

    expect(
        screen.getByRole('heading', { name: /recruiting workflows, written plainly/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^blog$/i }).some((link) => link.getAttribute('href') === '/blogs')).toBe(true);
    expect(screen.getByText(/made for recruiters who would rather hire than negotiate contracts/i)).toBeInTheDocument();

    expect(screen.getAllByRole('article')).toHaveLength(9);

    blogPosts.slice(0, 9).forEach((post) => {
        const heading = screen.getByRole('heading', { name: post.title });
        const card = heading.closest('article');

        expect(card).not.toBeNull();
        expect(within(card as HTMLElement).getByRole('link', { name: post.title })).toHaveAttribute(
            'href',
            `/blogs/${post.slug}`,
        );
        expect(screen.getByText(post.summary)).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: blogPosts[9].title })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/blog pagination/i)).toHaveTextContent('Page 1 of 2');
    expect(screen.getByRole('link', { name: /^next$/i })).toHaveAttribute('href', '/blogs?page=2');
});

test('renders page two of the Tahoe blog index', async () => {
    const ui = await BlogsPage({ searchParams: Promise.resolve({ page: '2' }) });

    render(ui);

    expect(screen.getAllByRole('article')).toHaveLength(blogPosts.length - 9);

    blogPosts.slice(9).forEach((post) => {
        expect(screen.getByRole('heading', { name: post.title })).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: blogPosts[0].title })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/blog pagination/i)).toHaveTextContent('Page 2 of 2');
    expect(screen.getByRole('link', { name: /^previous$/i })).toHaveAttribute('href', '/blogs');
});
