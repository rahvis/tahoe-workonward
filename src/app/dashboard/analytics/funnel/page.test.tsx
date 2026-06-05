import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';

import AnalyticsFunnelPage from './page';
import { clearAnalyticsCache } from '../_components/analytics-cache';
import {
    fetchAnalyticsFunnel,
    type AnalyticsFunnelResponse,
} from '@/lib/organization';

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams(''),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/analytics/funnel',
    useRouter: () => ({ replace: navigationMocks.replace }),
    useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock('@/lib/organization', () => ({
    fetchAnalyticsFunnel: vi.fn(),
}));

const mockedFetchAnalyticsFunnel = vi.mocked(fetchAnalyticsFunnel);

function funnelResponse(overrides: Partial<AnalyticsFunnelResponse> = {}): AnalyticsFunnelResponse {
    return {
        range: '7d',
        generated_at: '2026-05-10T12:00:00.000Z',
        last_rollup_at: '2026-05-10T11:55:00.000Z',
        rollup_status: 'fresh',
        rollup_lag_seconds: 300,
        rollup_message: null,
        stages: Array.from({ length: 25 }, (_, index) => ({
            key: `stage-${index + 1}`,
            label: `Stage ${index + 1}`,
            count: 100 - index,
            conversion_from_previous: index === 0 ? null : 90 - index,
            avg_hours_from_previous: index === 0 ? null : index + 0.5,
        })),
        ...overrides,
    };
}

beforeEach(() => {
    clearAnalyticsCache();
    navigationMocks.replace.mockReset();
    navigationMocks.searchParams = new URLSearchParams('');
    mockedFetchAnalyticsFunnel.mockReset();
    mockedFetchAnalyticsFunnel.mockResolvedValue(funnelResponse());
});

test('renders funnel and timing tabs with compact rollup state', async () => {
    const user = userEvent.setup();

    render(<AnalyticsFunnelPage />);

    expect(await screen.findByText('Conversion ladder')).toBeInTheDocument();
    expect(screen.getByText('Fresh')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Funnel' }).closest('nav')).toContainElement(
        screen.getByRole('button', { name: '7D' }),
    );

    await user.click(screen.getByRole('tab', { name: 'Timing' }));

    expect(screen.getByText('Time between stages')).toBeInTheDocument();
    expect(screen.getByText('Stage 2')).toBeInTheDocument();
});

test('renders zero-data funnel bars as aligned placeholders', async () => {
    mockedFetchAnalyticsFunnel.mockResolvedValueOnce(funnelResponse({
        stages: [
            {
                key: 'search',
                label: 'Search results surfaced',
                count: 0,
                conversion_from_previous: null,
                avg_hours_from_previous: null,
            },
            {
                key: 'saved',
                label: 'Saved candidates',
                count: 0,
                conversion_from_previous: 0,
                avg_hours_from_previous: null,
            },
            {
                key: 'enriched',
                label: 'Enriched candidates',
                count: 0,
                conversion_from_previous: 0,
                avg_hours_from_previous: null,
            },
        ],
    }));

    render(<AnalyticsFunnelPage />);

    expect(await screen.findByText('Conversion ladder')).toBeInTheDocument();
    const bars = screen.getAllByTestId('funnel-stage-bar');
    expect(bars).toHaveLength(3);
    expect(new Set(bars.map((bar) => bar.style.height))).toEqual(new Set(['34px']));
    expect(bars.every((bar) => bar.parentElement?.className.includes('funnelBarArea'))).toBe(true);
});

test('paginates funnel details at 20 rows', async () => {
    const user = userEvent.setup();
    navigationMocks.searchParams = new URLSearchParams('tab=details');

    render(<AnalyticsFunnelPage />);

    expect(await screen.findByText('Stage 1')).toBeInTheDocument();
    expect(screen.getByText('Rows 1-20 of 25 stages')).toBeInTheDocument();
    expect(screen.queryByText('Stage 21')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Rows 21-25 of 25 stages')).toBeInTheDocument();
    expect(screen.getByText('Stage 21')).toBeInTheDocument();
    expect(screen.queryByText('Stage 1')).not.toBeInTheDocument();
});

test('normalizes invalid funnel tabs back to funnel', async () => {
    navigationMocks.searchParams = new URLSearchParams('range=90d&tab=unknown');

    render(<AnalyticsFunnelPage />);

    expect(await screen.findByText('Conversion ladder')).toBeInTheDocument();
    await waitFor(() => {
        expect(navigationMocks.replace).toHaveBeenCalledWith(
            '/dashboard/analytics/funnel?range=90d&tab=funnel',
            { scroll: false },
        );
    });
});
