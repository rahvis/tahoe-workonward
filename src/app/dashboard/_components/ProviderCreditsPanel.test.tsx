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

test('shows only Search and Enrich (Starter 300/200) and does not prompt when available', async () => {
    mockedFetchProviderCredits.mockResolvedValue(providerCredits({
        coresignal_search: { allocated: 300, used: 0, remaining: 300 },
        coresignal_collect: { allocated: 0, used: 0, remaining: 0 },
        fullenrich: { allocated: 200, used: 0, remaining: 200 },
    }));

    render(<ProviderCreditsPanel />);

    const panel = await screen.findByLabelText('Provider credits');
    expect(within(panel).getByText('Search')).toBeInTheDocument();
    expect(within(panel).getByText('Enrich')).toBeInTheDocument();
    // Collect is no longer shown.
    expect(within(panel).queryByText('Collect')).not.toBeInTheDocument();
    expect(within(panel).getByText('300/300')).toBeInTheDocument();
    expect(within(panel).getByText('200/200')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Add credits' })).not.toBeInTheDocument();
});

test('prompts to top up when a single bucket (enrich) runs out', async () => {
    mockedFetchProviderCredits.mockResolvedValue(providerCredits({
        coresignal_search: { allocated: 300, used: 10, remaining: 290 }, // plenty
        coresignal_collect: { allocated: 0, used: 0, remaining: 0 },
        fullenrich: { allocated: 200, used: 200, remaining: 0 },         // depleted
    }));

    render(<ProviderCreditsPanel collapsed />);

    expect(await screen.findByRole('dialog', { name: 'Add credits' })).toBeInTheDocument();
    expect(screen.getByText(/Your Enrich credit is running low/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add credits' })).toHaveAttribute(
        'href',
        'https://tahoe.workonward.com/dashboard/billing/plan?tab=topups',
    );
});
