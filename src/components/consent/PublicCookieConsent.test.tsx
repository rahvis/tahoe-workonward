import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as CookieConsent from 'vanilla-cookieconsent';
import PublicCookieConsent from './PublicCookieConsent';

let pathname = '/';

vi.mock('next/navigation', () => ({
    usePathname: () => pathname,
}));

beforeEach(() => {
    pathname = '/';
    vi.mocked(CookieConsent.run).mockReset();
    vi.mocked(CookieConsent.hide).mockReset();
    vi.mocked(CookieConsent.hidePreferences).mockReset();
    vi.mocked(CookieConsent.run).mockResolvedValue(undefined);
});

test('initializes CookieConsent once on public routes', async () => {
    const { rerender } = render(<PublicCookieConsent />);

    await waitFor(() => {
        expect(CookieConsent.run).toHaveBeenCalledTimes(1);
    });

    rerender(<PublicCookieConsent />);

    expect(CookieConsent.run).toHaveBeenCalledTimes(1);
});

test('does not initialize CookieConsent on dashboard routes', () => {
    pathname = '/dashboard/search/new';

    render(<PublicCookieConsent />);

    expect(CookieConsent.run).not.toHaveBeenCalled();
});

test('hides CookieConsent UI after leaving public routes', async () => {
    const { rerender } = render(<PublicCookieConsent />);

    await waitFor(() => {
        expect(CookieConsent.run).toHaveBeenCalledTimes(1);
    });

    pathname = '/dashboard/search/new';
    rerender(<PublicCookieConsent />);

    expect(CookieConsent.hide).toHaveBeenCalledTimes(1);
    expect(CookieConsent.hidePreferences).toHaveBeenCalledTimes(1);
});
