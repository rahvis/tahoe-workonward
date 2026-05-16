import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PublicGoogleAnalytics from './PublicGoogleAnalytics';
import {
    clearTrackedPublicPage,
    isPublicAnalyticsPath,
    syncAnalyticsConsent,
    trackPublicPageView,
} from '@/lib/public-analytics';

let pathname = '/';

vi.mock('next/navigation', () => ({
    usePathname: () => pathname,
}));

vi.mock('@/lib/public-analytics', () => ({
    clearTrackedPublicPage: vi.fn(),
    isPublicAnalyticsPath: vi.fn((currentPath: string) => currentPath === '/'),
    syncAnalyticsConsent: vi.fn(async () => true),
    trackPublicPageView: vi.fn(),
}));

beforeEach(() => {
    pathname = '/';
    vi.mocked(clearTrackedPublicPage).mockReset();
    vi.mocked(isPublicAnalyticsPath).mockClear();
    vi.mocked(syncAnalyticsConsent).mockReset();
    vi.mocked(trackPublicPageView).mockReset();
    vi.mocked(syncAnalyticsConsent).mockResolvedValue(true);
});

test('initializes landing-page analytics only on tracked public routes', async () => {
    render(<PublicGoogleAnalytics />);

    await waitFor(() => {
        expect(syncAnalyticsConsent).toHaveBeenCalledTimes(1);
    });

    expect(trackPublicPageView).toHaveBeenCalledWith('/');
});

test('does not initialize analytics on dashboard routes', () => {
    pathname = '/dashboard/search/new';

    render(<PublicGoogleAnalytics />);

    expect(syncAnalyticsConsent).not.toHaveBeenCalled();
    expect(trackPublicPageView).not.toHaveBeenCalled();
    expect(clearTrackedPublicPage).toHaveBeenCalledTimes(1);
});

test('re-syncs analytics when public consent changes', async () => {
    render(<PublicGoogleAnalytics />);

    await waitFor(() => {
        expect(syncAnalyticsConsent).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new CustomEvent('cc:onConsent'));

    await waitFor(() => {
        expect(syncAnalyticsConsent).toHaveBeenCalledTimes(2);
    });
});
