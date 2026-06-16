import { render, screen } from '@testing-library/react';
import CookiePage from './cookie/page';
import PrivacyPage from './privacy/page';
import TermsPage from './terms/page';

test('privacy page includes a cookie settings trigger', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('button', { name: /cookie settings/i })).toBeInTheDocument();
});

test('terms page includes a cookie settings trigger', () => {
    render(<TermsPage />);

    expect(screen.getByRole('button', { name: /cookie settings/i })).toBeInTheDocument();
});

test('cookie page reflects the live consent cookie and settings control', () => {
    render(<CookiePage />);

    expect(screen.getAllByText(/tahoe_cookie_consent/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /cookie settings/i })).toBeInTheDocument();
});
