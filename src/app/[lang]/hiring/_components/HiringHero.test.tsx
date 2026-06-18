import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import HiringHero from './HiringHero';

// Reduced-motion so the auto-cycle interval never starts — keeps the test deterministic.
beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
});
afterEach(() => {
    vi.unstubAllGlobals();
});

const frames = [
    { key: 'draft', label: 'Draft', tag: 'Draft with AI', title: 'Frame draft', lines: ['line one'] },
    { key: 'rank', label: 'Rank', tag: 'Match 92%', title: 'Frame rank', lines: ['line two'] },
] as const;

const axes = [
    { label: 'Skills', value: 95 },
    { label: 'Experience', value: 90 },
    { label: 'Tools', value: 92 },
    { label: 'Domain', value: 80 },
    { label: 'Education', value: 70 },
    { label: 'Location', value: 78 },
] as const;

function renderHero() {
    render(
        <HiringHero
            h1="HeroTitle"
            lede="lede copy"
            ctaStart="Start for free"
            ctaStartNote="note"
            demoCta="Book a demo"
            framesLabel="loop"
            frames={frames}
            matchAxes={axes}
            matchRequired={88}
            radarAria="match radar"
            signupHref="/en/signup"
            demoUrl="https://demo.example"
        />,
    );
}

test('renders hero copy and CTAs with correct links', () => {
    renderHero();
    expect(screen.getByRole('heading', { name: 'HeroTitle' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start for free' })).toHaveAttribute('href', '/en/signup');
    expect(screen.getByRole('link', { name: 'Book a demo' })).toHaveAttribute('href', 'https://demo.example');
});

test('scrubs frames via chips and shows the radar on the rank frame', () => {
    renderHero();
    expect(screen.getByText('Frame draft')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Rank' }));

    expect(screen.getByText('Frame rank')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'match radar' })).toBeInTheDocument();
});
