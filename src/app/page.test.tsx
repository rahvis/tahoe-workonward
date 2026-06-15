import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LandingPage from './page';

vi.mock('next/font/google', () => ({
    Inter: () => ({ className: 'inter-font', variable: 'inter-variable' }),
    Montserrat: () => ({ className: 'montserrat-font', variable: 'montserrat-variable' }),
}));

test('renders Tahoe landing content with auth CTAs pointing to dedicated routes', () => {
    render(<LandingPage />);

    expect(
        screen.getByRole('heading', {
            name: /search 800m\+ profiles in your own words/i,
        }),
    ).toBeInTheDocument();

    expect(
        screen.getAllByRole('link', { name: /^sign in$/i }).every((link) => link.getAttribute('href') === '/login'),
    ).toBe(true);
    expect(
        screen.getAllByRole('link', { name: /start for free/i }).every((link) => link.getAttribute('href') === '/signup'),
    ).toBe(true);
    expect(
        screen.getAllByRole('link', { name: /book a demo/i }).every((link) => link.getAttribute('href') === '/contact'),
    ).toBe(true);
    expect(
        screen.getAllByRole('link', { name: /^blog$/i }).every((link) => link.getAttribute('href') === '/blogs'),
    ).toBe(true);
    expect(screen.getByText(/continue with google or email\. no credit card\./i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /cookie settings/i }).length).toBeGreaterThan(0);
    // The shared footer must be present on the home page too, including the
    // Resources link (consistent footer across every page, opens in a new tab).
    const resourcesLink = screen
        .getAllByRole('link', { name: /^resources$/i })
        .find((link) => link.getAttribute('href') === '/resources');
    expect(resourcesLink).toBeDefined();
    expect(resourcesLink).toHaveAttribute('target', '_blank');
    expect(screen.queryByTestId('google-signin-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-signup-button')).not.toBeInTheDocument();
});

test('proof showcase renders interactive tabs and swaps the panel on click', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    expect(screen.getByRole('tab', { name: /800m\+ profiles/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/search the world's talent/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /verified emails and phones/i }));

    expect(screen.getByRole('tab', { name: /verified emails and phones/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/reach people for real/i)).toBeInTheDocument();
    expect(screen.queryByText(/search the world's talent/i)).not.toBeInTheDocument();
});

test('renders Blog in the mobile navigation', () => {
    render(<LandingPage />);

    fireEvent.click(screen.getByLabelText(/toggle navigation/i, { selector: 'button' }));

    expect(
        within(screen.getByLabelText(/mobile navigation/i)).getByRole('link', { name: /^blog$/i, hidden: true }),
    ).toHaveAttribute('href', '/blogs');
});

test('switches between PRD-inspired mock screen tabs without rendering live auth widgets', async () => {
    const user = userEvent.setup();

    render(<LandingPage />);

    expect(screen.getByText(/interactive preview limit: up to 100 results/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /lists \+ enrich/i }));
    expect(screen.getByText(/estimate: 47 contacts × 11 credits = 517/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /campaigns \+ mailboxes/i }));
    expect(screen.getByText(/today sent: 12 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/step 2 - wait 3 days/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /billing \+ analytics/i }));
    expect(screen.getByText(/credit ledger/i)).toBeInTheDocument();
    expect(screen.getAllByText(/reply rate/i).length).toBeGreaterThan(0);
});
