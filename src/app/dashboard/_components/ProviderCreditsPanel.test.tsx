import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProviderCreditsPanel from './ProviderCreditsPanel';
import { fetchBillingSummary, fetchBillingCatalog, type BillingSummary } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchBillingSummary: vi.fn(),
    fetchBillingCatalog: vi.fn(),
    createTopUpCheckout: vi.fn(),
}));

const mockedSummary = vi.mocked(fetchBillingSummary);
const mockedCatalog = vi.mocked(fetchBillingCatalog);

function summary(available: number, included: number, low: BillingSummary['low_credit_state'] = 'healthy'): BillingSummary {
    return {
        workspace_id: 'ws-1',
        billing: {},
        available_credits: available,
        reserved_credits: 0,
        monthly_included_credits: included,
        buckets: [],
        usage_this_cycle: {} as BillingSummary['usage_this_cycle'],
        low_credit_thresholds: [25, 10, 0],
        low_credit_state: low,
    } as BillingSummary;
}

beforeEach(() => {
    mockedSummary.mockReset();
    mockedCatalog.mockReset();
    mockedCatalog.mockResolvedValue({
        plans: [], rate_card: {}, low_credit_thresholds: [], automatic_tax_enabled: false, portal_enabled: true,
        topups: [
            { key: 'topup_200', credits: 200, price_usd: 35, stripe_product_lookup_key: '', stripe_price_lookup_key: '', bucket: null },
            { key: 'topup_1500', credits: 1500, price_usd: 189, stripe_product_lookup_key: '', stripe_price_lookup_key: '', bucket: null },
        ],
    });
});

test('shows one unified balance with a Top up button', async () => {
    mockedSummary.mockResolvedValue(summary(380, 400));

    render(<ProviderCreditsPanel />);

    const panel = await screen.findByLabelText('Credits');
    expect(within(panel).getByText('380')).toBeInTheDocument();
    expect(within(panel).getByText('/ 400 /mo')).toBeInTheDocument();
    // No more two-bucket split.
    expect(within(panel).queryByText('Search')).not.toBeInTheDocument();
    expect(within(panel).queryByText('Enrich')).not.toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Top up' })).toBeInTheDocument();
});

test('hides for a trial workspace with no plan and no credits', async () => {
    mockedSummary.mockResolvedValue(summary(0, 0));
    render(<ProviderCreditsPanel />);
    // Give the effect a tick; nothing should render.
    await Promise.resolve();
    expect(screen.queryByLabelText('Credits')).not.toBeInTheDocument();
});

test('opens the top-up modal from the Top up button', async () => {
    const user = userEvent.setup();
    mockedSummary.mockResolvedValue(summary(10, 400, 'critical'));

    render(<ProviderCreditsPanel />);

    await user.click(await screen.findByRole('button', { name: 'Top up' }));
    expect(await screen.findByRole('dialog', { name: 'Top up credits' })).toBeInTheDocument();
});
