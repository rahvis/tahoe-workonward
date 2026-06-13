import { render, screen } from '@testing-library/react';
import { getResource, resources } from '@/lib/resources';
import ResourcePage, { generateMetadata, generateStaticParams } from './page';

const slug = 'search-tips-and-tricks';

test('generateStaticParams covers every resource', () => {
    expect(generateStaticParams()).toEqual(resources.map((resource) => ({ slug: resource.slug })));
});

test('renders the search tips resource with its sections and chrome', async () => {
    const ui = await ResourcePage({ params: Promise.resolve({ slug }) });
    render(ui);

    const resource = getResource(slug)!;
    expect(screen.getByRole('heading', { level: 1, name: resource.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to resources/i })).toHaveAttribute('href', '/resources');

    resource.sections.forEach((section) => {
        expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
    });

    // Verified example prompts render in code boxes (with a tier chip).
    expect(screen.getByText('Line cooks in the United States')).toBeInTheDocument();
    expect(screen.getAllByText('Simple').length).toBeGreaterThan(0);

    // Tuning tables render as real tables with headers.
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader').some((cell) => /What to do/i.test(cell.textContent ?? ''))).toBe(true);

    // Footer present (navbar + footer requirement).
    expect(screen.getByText(/made for recruiters who would rather hire than negotiate contracts/i)).toBeInTheDocument();
});

test('builds canonical metadata for a known resource', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(metadata.alternates?.canonical).toBe(`/resources/${slug}`);
    expect(metadata.title).toBe(getResource(slug)!.metaTitle);
});

test('falls back to a default title for an unknown resource', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'does-not-exist' }) });
    expect(metadata.title).toBe('Tahoe Resources');
});
