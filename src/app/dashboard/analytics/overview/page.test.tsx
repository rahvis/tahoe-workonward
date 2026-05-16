import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';

import AnalyticsOverviewPage from './page';
import { clearAnalyticsCache } from '../_components/analytics-cache';
import {
    fetchAnalyticsOverview,
    fetchAnalyticsPredictions,
    type AnalyticsOverviewResponse,
    type AnalyticsPredictionsResponse,
} from '@/lib/organization';

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams(''),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/analytics/overview',
    useRouter: () => ({ replace: navigationMocks.replace }),
    useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock('@/lib/organization', () => ({
    fetchAnalyticsOverview: vi.fn(),
    fetchAnalyticsPredictions: vi.fn(),
}));

const mockedFetchAnalyticsOverview = vi.mocked(fetchAnalyticsOverview);
const mockedFetchAnalyticsPredictions = vi.mocked(fetchAnalyticsPredictions);

function overviewResponse(overrides: Partial<AnalyticsOverviewResponse> = {}): AnalyticsOverviewResponse {
    return {
        range: '7d',
        generated_at: '2026-05-10T12:00:00.000Z',
        last_rollup_at: '2026-05-10T11:55:00.000Z',
        rollup_status: 'fresh',
        rollup_lag_seconds: 300,
        rollup_message: null,
        kpis: [
            {
                key: 'credits_spent',
                label: 'Credits spent',
                value: 42,
                display_value: '42',
                delta_pct: 8.2,
                trend: [10, 12, 20],
                detail: 'Actual credits consumed',
            },
        ],
        activity_trend: [
            { day: '2026-05-08T00:00:00.000Z', value: 3 },
            { day: '2026-05-09T00:00:00.000Z', value: 6 },
            { day: '2026-05-10T00:00:00.000Z', value: 4 },
        ],
        credit_spend_trend: [
            { day: '2026-05-08T00:00:00.000Z', search: 1, enrichment: 2, outreach: 0, total: 3 },
            { day: '2026-05-09T00:00:00.000Z', search: 2, enrichment: 3, outreach: 1, total: 6 },
        ],
        source_mix: [{ key: 'coresignal', label: 'Coresignal', value: 5, percentage: 100, metadata: {} }],
        workflow_mix: [{ key: 'searches', label: 'Searches', value: 9, percentage: 100, metadata: {} }],
        credit_snapshot: {
            available: 200,
            reserved: 10,
            monthly_included: 500,
            spent_in_range: 42,
            credit_runway_days: 15.4,
        },
        release_signals: [
            {
                key: 'rollup_lag',
                label: 'Rollup freshness',
                status: 'healthy',
                value: 'Current',
                detail: '0.2 hours since last completed rebuild',
            },
        ],
        ...overrides,
    };
}

function predictionsResponse(overrides: Partial<AnalyticsPredictionsResponse> = {}): AnalyticsPredictionsResponse {
    return {
        range: '7d',
        generated_at: '2026-05-10T12:00:00.000Z',
        last_rollup_at: '2026-05-10T11:55:00.000Z',
        rollup_status: 'fresh',
        rollup_lag_seconds: 300,
        rollup_message: null,
        projected_topup_at: '2026-05-21T21:36:00+00:00',
        predictions: [
            {
                key: 'credit_runway_days',
                label: 'Credit runway',
                display_value: '15.4 days',
                value: 15.4,
                insufficient_data: false,
                method_label: 'Trailing credit-burn estimate',
                explanation: 'Uses recent credit consumption to estimate how long current credits will last.',
            },
        ],
        ...overrides,
    };
}

beforeEach(() => {
    clearAnalyticsCache();
    navigationMocks.replace.mockReset();
    navigationMocks.searchParams = new URLSearchParams('');
    mockedFetchAnalyticsOverview.mockReset();
    mockedFetchAnalyticsPredictions.mockReset();
    mockedFetchAnalyticsOverview.mockResolvedValue(overviewResponse());
    mockedFetchAnalyticsPredictions.mockResolvedValue(predictionsResponse());
});

test('defaults to 7D and does not load forecasts until the forecasts tab opens', async () => {
    const user = userEvent.setup();

    render(<AnalyticsOverviewPage />);

    expect(await screen.findByText('Credits spent')).toBeInTheDocument();
    expect(screen.getByText(/Last rollup/i)).toBeInTheDocument();
    expect(mockedFetchAnalyticsPredictions).not.toHaveBeenCalled();

    await waitFor(() => {
        expect(mockedFetchAnalyticsOverview).toHaveBeenCalledWith({ range: '7d' }, expect.any(Object));
    });

    await user.click(screen.getByRole('tab', { name: 'Forecasts' }));

    expect(await screen.findByText('15.4 days')).toBeInTheDocument();
    expect(mockedFetchAnalyticsPredictions).toHaveBeenCalledWith({ range: '7d' }, expect.any(Object));
});

test('maps provider source labels to user-facing Search copy', async () => {
    const user = userEvent.setup();

    render(<AnalyticsOverviewPage />);

    await screen.findByText('Credits spent');
    await user.click(screen.getByRole('tab', { name: 'Workflow' }));

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.queryByText('Coresignal')).not.toBeInTheDocument();
});

test('renders a recruiter-visible error state when overview loading fails', async () => {
    mockedFetchAnalyticsOverview.mockRejectedValueOnce(new Error('Overview unavailable'));

    render(<AnalyticsOverviewPage />);

    expect(await screen.findByRole('heading', { name: 'Analytics unavailable' })).toBeInTheDocument();
    expect(screen.getByText('Overview unavailable')).toBeInTheDocument();
});

test('keeps cached data visible while revalidating the same range', async () => {
    const user = userEvent.setup();

    render(<AnalyticsOverviewPage />);

    expect(await screen.findByText('Credits spent')).toBeInTheDocument();
    mockedFetchAnalyticsOverview.mockRejectedValueOnce(new Error('Transient refresh failure'));

    await user.click(screen.getByRole('button', { name: '30D' }));
    await waitFor(() => expect(navigationMocks.replace).toHaveBeenCalled());
});
