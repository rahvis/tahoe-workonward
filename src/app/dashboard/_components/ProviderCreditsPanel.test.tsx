import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import ProviderCreditsPanel from './ProviderCreditsPanel';
import { fetchProviderCredits, type ProviderCreditsResponse } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchProviderCredits: vi.fn(),
}));

const mockedFetchProviderCredits = vi.mocked(fetchProviderCredits);

function providerCredits(
    buckets: ProviderCreditsResponse['buckets'],
): ProviderCreditsResponse {
    return {
        workspace_id: 'ws-1',
        enabled: true,
        buckets,
        account: {
            coresignal_search_remaining: null,
            coresignal_collect_remaining: null,
            fullenrich_balance: null,
        },
        allocated_at: '2026-06-10T00:00:00Z',
    };
}

beforeEach(() => {
    mockedFetchProviderCredits.mockReset();
});

test('does not prompt when provider credits are still available', async () => {
    mockedFetchProviderCredits.mockResolvedValue(providerCredits({
        coresignal_search: { allocated: 100, used: 0, remaining: 100 },
        coresignal_collect: { allocated: 200, used: 0, remaining: 200 },
        fullenrich: { allocated: 100, used: 0, remaining: 100 },
    }));

    render(<ProviderCreditsPanel />);

    const panel = await screen.findByLabelText('Provider credits');
    expect(within(panel).getByText('Search')).toBeInTheDocument();
    expect(within(panel).getByText('Collect')).toBeInTheDocument();
    expect(within(panel).getByText('Enrich')).toBeInTheDocument();
    expect(within(panel).getAllByText('100/100')).toHaveLength(2);
    expect(within(panel).getByText('200/200')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Add credits' })).not.toBeInTheDocument();
});

test('prompts for top-up credits when combined provider usage reaches 95 percent', async () => {
    mockedFetchProviderCredits.mockResolvedValue(providerCredits({
        coresignal_search: { allocated: 100, used: 95, remaining: 5 },
        coresignal_collect: { allocated: 200, used: 190, remaining: 10 },
        fullenrich: { allocated: 100, used: 95, remaining: 5 },
    }));

    render(<ProviderCreditsPanel collapsed />);

    expect(await screen.findByRole('dialog', { name: 'Add credits' })).toBeInTheDocument();
    expect(screen.getByText(/used 95% of your Search, Collect, and Enrich provider credits/i)).toBeInTheDocument();
    expect(screen.getByText(/380 of 400 provider credits consumed/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add credits' })).toHaveAttribute(
        'href',
        'https://tahoe.workonward.com/dashboard/billing/plan?tab=topups',
    );
});
