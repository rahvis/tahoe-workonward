import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import * as CookieConsent from 'vanilla-cookieconsent';
import CookieSettingsButton from './CookieSettingsButton';

beforeEach(() => {
    vi.mocked(CookieConsent.showPreferences).mockReset();
});

test('opens the CookieConsent preferences modal when clicked', async () => {
    const user = userEvent.setup();

    render(<CookieSettingsButton />);

    await user.click(screen.getByRole('button', { name: /cookie settings/i }));

    expect(CookieConsent.showPreferences).toHaveBeenCalledTimes(1);
});
