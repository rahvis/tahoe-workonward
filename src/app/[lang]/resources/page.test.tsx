import { render, screen, within } from '@testing-library/react';
import { resources } from '@/lib/resources';
import ResourcesPage from './page';

test('renders the Tahoe resources index with each resource card', () => {
    render(<ResourcesPage />);

    expect(
        screen.getByRole('heading', { name: /guides to get more out of tahoe/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByText(/made for recruiters who would rather hire than negotiate contracts/i)).toBeInTheDocument();

    expect(screen.getAllByRole('article')).toHaveLength(resources.length);

    resources.forEach((resource) => {
        const heading = screen.getByRole('heading', { name: resource.title });
        const card = heading.closest('article');
        expect(card).not.toBeNull();
        expect(within(card as HTMLElement).getByRole('link', { name: resource.title })).toHaveAttribute(
            'href',
            `/resources/${resource.slug}`,
        );
        expect(screen.getByText(resource.summary)).toBeInTheDocument();
    });
});

test('links the footer Resources entry to /resources in a new tab', () => {
    render(<ResourcesPage />);

    const resourcesLink = screen
        .getAllByRole('link', { name: /^resources$/i })
        .find((link) => link.getAttribute('href') === '/resources');

    expect(resourcesLink).toBeDefined();
    expect(resourcesLink).toHaveAttribute('target', '_blank');
    expect(resourcesLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
});
