import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';

import AnalyticsCampaignsPage from './page';
import { clearAnalyticsCache } from '../_components/analytics-cache';
import {
    fetchAnalyticsCampaignDetail,
    fetchAnalyticsCampaignPerformance,
    type AnalyticsCampaignDetailResponse,
    type AnalyticsCampaignPerformanceResponse,
} from '@/lib/organization';

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams(''),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/analytics/campaigns',
    useRouter: () => ({ replace: navigationMocks.replace }),
    useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock('@/lib/organization', () => ({
    fetchAnalyticsCampaignDetail: vi.fn(),
    fetchAnalyticsCampaignPerformance: vi.fn(),
}));

const mockedFetchCampaigns = vi.mocked(fetchAnalyticsCampaignPerformance);
const mockedFetchCampaignDetail = vi.mocked(fetchAnalyticsCampaignDetail);

function campaignPerformanceResponse(
    overrides: Partial<AnalyticsCampaignPerformanceResponse> = {},
): AnalyticsCampaignPerformanceResponse {
    return {
        range: '7d',
        generated_at: '2026-05-10T12:00:00.000Z',
        last_rollup_at: '2026-05-10T11:55:00.000Z',
        rollup_status: 'fresh',
        rollup_lag_seconds: 300,
        rollup_message: null,
        summary: [
            {
                key: 'sent',
                label: 'Sent',
                value: 100,
                display_value: '100',
                delta_pct: null,
                trend: [10, 20],
                detail: 'Messages sent',
            },
        ],
        reply_rate_trend: [{ day: '2026-05-10T00:00:00.000Z', value: 15 }],
        send_volume_trend: [{ day: '2026-05-10T00:00:00.000Z', value: 100 }],
        campaign_leaderboard: Array.from({ length: 25 }, (_, index) => ({
            campaign_id: `campaign-${index + 1}`,
            campaign_name: `Campaign ${index + 1}`,
            status: 'active',
            project_id: `project-${index + 1}`,
            project_name: `Project ${index + 1}`,
            sent: 100 + index,
            replied: 10 + index,
            bounced: index,
            active_enrollments: 20 + index,
            reply_rate: 10 + index,
        })),
        ...overrides,
    };
}

function campaignDetailResponse(
    overrides: Partial<AnalyticsCampaignDetailResponse> = {},
): AnalyticsCampaignDetailResponse {
    return {
        range: '7d',
        generated_at: '2026-05-10T12:00:00.000Z',
        last_rollup_at: '2026-05-10T11:55:00.000Z',
        rollup_status: 'fresh',
        rollup_lag_seconds: 300,
        rollup_message: null,
        campaign: {
            campaign_id: 'campaign-1',
            campaign_name: 'Campaign 1',
            status: 'active',
            project_id: 'project-1',
            project_name: 'Project 1',
            sent: 100,
            replied: 10,
            bounced: 1,
            active_enrollments: 25,
            reply_rate: 10,
        },
        daily: [{ day: '2026-05-10T00:00:00.000Z', value: 10 }],
        reply_rate_trend: [{ day: '2026-05-10T00:00:00.000Z', value: 10 }],
        status_breakdown: [{ status: 'active', count: 25, percentage: 100 }],
        enrollments: Array.from({ length: 25 }, (_, index) => ({
            id: `enrollment-${index + 1}`,
            candidate_id: `candidate-${index + 1}`,
            candidate_name: `Candidate ${index + 1}`,
            candidate_email: null,
            company_name: `Company ${index + 1}`,
            job_title: 'Engineer',
            status: 'active',
            current_step_order: 1,
            next_send_at: null,
            last_error: null,
            created_at: null,
            updated_at: null,
        })),
        task_health: [
            {
                key: 'queued',
                label: 'Queued',
                value: 3,
                display_value: '3',
                delta_pct: null,
                trend: [],
                detail: null,
            },
        ],
        next_cursor: null,
        ...overrides,
    };
}

beforeEach(() => {
    clearAnalyticsCache();
    navigationMocks.replace.mockReset();
    navigationMocks.searchParams = new URLSearchParams('');
    mockedFetchCampaigns.mockReset();
    mockedFetchCampaignDetail.mockReset();
    mockedFetchCampaigns.mockResolvedValue(campaignPerformanceResponse());
    mockedFetchCampaignDetail.mockResolvedValue(campaignDetailResponse());
});

test('removes drilldown tab and paginates the leaderboard', async () => {
    const user = userEvent.setup();
    navigationMocks.searchParams = new URLSearchParams('tab=leaderboard');

    render(<AnalyticsCampaignsPage />);

    expect(await screen.findByText('Campaign 1')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Drilldown' })).not.toBeInTheDocument();
    expect(screen.getByText('Rows 1-20 of 25 campaigns')).toBeInTheDocument();
    expect(screen.queryByText('Campaign 21')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Rows 21-25 of 25 campaigns')).toBeInTheDocument();
    expect(screen.getByText('Campaign 21')).toBeInTheDocument();
});

test('opens campaign drawer from leaderboard and paginates delivery rows', async () => {
    const user = userEvent.setup();
    navigationMocks.searchParams = new URLSearchParams('tab=leaderboard');

    render(<AnalyticsCampaignsPage />);

    await user.click(await screen.findByText('Campaign 1'));

    await waitFor(() => {
        expect(navigationMocks.replace).toHaveBeenCalledWith(
            '/dashboard/analytics/campaigns?tab=leaderboard&range=7d&campaign_id=campaign-1',
            { scroll: false },
        );
    });
    expect(await screen.findByLabelText('Campaign analytics detail')).toBeInTheDocument();
    expect(mockedFetchCampaignDetail).toHaveBeenCalledWith(
        'campaign-1',
        { range: '7d', limit: 50 },
        expect.any(Object),
    );

    const drawer = screen.getByLabelText('Campaign analytics detail');
    await user.click(within(drawer).getByRole('tab', { name: 'Delivery' }));

    expect(within(drawer).getByText('Rows 1-20 of 25 enrollments')).toBeInTheDocument();
    expect(within(drawer).queryByText('Candidate 21')).not.toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Next' }));

    expect(within(drawer).getByText('Rows 21-25 of 25 enrollments')).toBeInTheDocument();
    expect(within(drawer).getByText('Candidate 21')).toBeInTheDocument();
});

test('normalizes old drilldown links to the leaderboard while keeping campaign detail open', async () => {
    navigationMocks.searchParams = new URLSearchParams('range=30d&tab=drilldown&campaign_id=campaign-1');

    render(<AnalyticsCampaignsPage />);

    expect(await screen.findByLabelText('Campaign analytics detail')).toBeInTheDocument();
    await waitFor(() => {
        expect(navigationMocks.replace).toHaveBeenCalledWith(
            '/dashboard/analytics/campaigns?range=30d&tab=leaderboard&campaign_id=campaign-1',
            { scroll: false },
        );
    });
});

test('clears stale campaign detail while a newly selected campaign loads', async () => {
    const user = userEvent.setup();
    let resolveSecondDetail: ((value: AnalyticsCampaignDetailResponse) => void) | undefined;
    mockedFetchCampaignDetail
        .mockResolvedValueOnce(campaignDetailResponse())
        .mockReturnValueOnce(new Promise((resolve) => {
            resolveSecondDetail = resolve;
        }));
    navigationMocks.searchParams = new URLSearchParams('tab=leaderboard');

    render(<AnalyticsCampaignsPage />);

    await user.click(await screen.findByText('Campaign 1'));
    const firstDrawer = await screen.findByLabelText('Campaign analytics detail');
    expect(within(firstDrawer).getByRole('heading', { name: 'Campaign 1' })).toBeInTheDocument();

    await user.click(screen.getByText('Campaign 2'));

    const loadingDrawer = screen.getByLabelText('Campaign analytics detail');
    expect(within(loadingDrawer).queryByRole('heading', { name: 'Campaign 1' })).not.toBeInTheDocument();
    expect(within(loadingDrawer).getByRole('heading', { name: 'Loading detail' })).toBeInTheDocument();

    resolveSecondDetail?.(campaignDetailResponse({
        campaign: {
            campaign_id: 'campaign-2',
            campaign_name: 'Campaign 2',
            status: 'active',
            project_id: 'project-2',
            project_name: 'Project 2',
            sent: 101,
            replied: 11,
            bounced: 1,
            active_enrollments: 26,
            reply_rate: 11,
        },
    }));

    expect(await within(loadingDrawer).findByRole('heading', { name: 'Campaign 2' })).toBeInTheDocument();
});
