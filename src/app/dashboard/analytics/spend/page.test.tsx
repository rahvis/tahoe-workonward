import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';

import AnalyticsSpendPage from './page';
import { clearAnalyticsCache } from '../_components/analytics-cache';
import {
    fetchAnalyticsSpend,
    type AnalyticsSpendResponse,
} from '@/lib/organization';

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams(''),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/analytics/spend',
    useRouter: () => ({ replace: navigationMocks.replace }),
    useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock('@/lib/organization', () => ({
    fetchAnalyticsSpend: vi.fn(),
}));

const mockedFetchAnalyticsSpend = vi.mocked(fetchAnalyticsSpend);

function spendResponse(overrides: Partial<AnalyticsSpendResponse> = {}): AnalyticsSpendResponse {
    return {
        range: '7d',
        generated_at: '2026-05-10T12:00:00.000Z',
        last_rollup_at: '2026-05-10T11:55:00.000Z',
        rollup_status: 'fresh',
        rollup_lag_seconds: 300,
        rollup_message: null,
        categories: [{ key: 'search', label: 'Search', credits: 40, percentage: 100 }],
        daily: [{ day: '2026-05-10T00:00:00.000Z', search: 40, enrichment: 0, outreach: 0, total: 40 }],
        by_project: [{ key: 'project-1', label: 'Project 1', credits: 40, percentage: 100, project_id: 'project-1' }],
        by_campaign: [{ key: 'campaign-1', label: 'Campaign 1', credits: 40, percentage: 100, campaign_id: 'campaign-1' }],
        high_cost_events: Array.from({ length: 25 }, (_, index) => ({
            idempotency_key: `event-${index + 1}`,
            kind: 'search',
            label: `Event ${index + 1}`,
            credits: 10 + index,
            created_at: '2026-05-10T12:00:00.000Z',
            project_id: 'project-1',
            project_name: 'Project 1',
            campaign_id: 'campaign-1',
            campaign_name: 'Campaign 1',
            source_ref: null,
            metadata: {},
        })),
        credit_snapshot: {
            available: 200,
            reserved: 10,
            monthly_included: 500,
            spent_in_range: 42,
            credit_runway_days: 15.4,
        },
        unit_economics: [
            {
                key: 'cost_per_reply',
                label: 'Cost per reply',
                value: 2,
                display_value: '2',
                delta_pct: null,
                trend: [],
                detail: 'Credits per reply',
            },
        ],
        ...overrides,
    };
}

beforeEach(() => {
    clearAnalyticsCache();
    navigationMocks.replace.mockReset();
    navigationMocks.searchParams = new URLSearchParams('');
    mockedFetchAnalyticsSpend.mockReset();
    mockedFetchAnalyticsSpend.mockResolvedValue(spendResponse());
});

test('paginates spend events at 20 rows', async () => {
    const user = userEvent.setup();
    navigationMocks.searchParams = new URLSearchParams('tab=events');

    render(<AnalyticsSpendPage />);

    expect(await screen.findByText('Event 1')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Events' }).closest('nav')).toContainElement(
        screen.getByRole('button', { name: '7D' }),
    );
    expect(screen.getByText('Rows 1-20 of 25 events')).toBeInTheDocument();
    expect(screen.queryByText('Event 21')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Rows 21-25 of 25 events')).toBeInTheDocument();
    expect(screen.getByText('Event 21')).toBeInTheDocument();
});

test('normalizes invalid spend tabs back to summary', async () => {
    navigationMocks.searchParams = new URLSearchParams('range=365d&tab=unknown');

    render(<AnalyticsSpendPage />);

    expect(await screen.findByText('Available')).toBeInTheDocument();
    await waitFor(() => {
        expect(navigationMocks.replace).toHaveBeenCalledWith(
            '/dashboard/analytics/spend?range=365d&tab=summary',
            { scroll: false },
        );
    });
});
