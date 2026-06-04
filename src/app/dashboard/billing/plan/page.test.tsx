import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import BillingPlanPage from './page';
import {
    createBillingPortal,
    createSubscriptionCheckout,
    createTopUpCheckout,
    fetchBillingCatalog,
    fetchBillingSummary,
} from '@/lib/organization';

const replaceMock = vi.fn();
let searchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/billing/plan',
    useRouter: () => ({ replace: replaceMock }),
    useSearchParams: () => searchParams,
}));

vi.mock('@/lib/organization', () => ({
    createBillingPortal: vi.fn(),
    createSubscriptionCheckout: vi.fn(),
    createTopUpCheckout: vi.fn(),
    fetchBillingCatalog: vi.fn(),
    fetchBillingSummary: vi.fn(),
}));

const mockedFetchBillingSummary = vi.mocked(fetchBillingSummary);
const mockedFetchBillingCatalog = vi.mocked(fetchBillingCatalog);
const mockedCreateBillingPortal = vi.mocked(createBillingPortal);
const mockedCreateSubscriptionCheckout = vi.mocked(createSubscriptionCheckout);
const mockedCreateTopUpCheckout = vi.mocked(createTopUpCheckout);

beforeEach(() => {
    searchParams = new URLSearchParams('');
    replaceMock.mockReset();
    mockedFetchBillingSummary.mockReset();
    mockedFetchBillingCatalog.mockReset();
    mockedCreateBillingPortal.mockReset();
    mockedCreateSubscriptionCheckout.mockReset();
    mockedCreateTopUpCheckout.mockReset();

    mockedFetchBillingSummary.mockResolvedValue({
        workspace_id: 'ws-1',
        billing: {
            plan_key: 'starter',
            interval: 'month',
            subscription_status: 'active',
            current_period_end: '2026-06-10T00:00:00.000Z',
            active_entitlements: ['tahoe-plan-starter'],
            limits: { mailboxes: 1, active_campaigns: 2 },
        },
        available_credits: 200,
        reserved_credits: 5,
        monthly_included_credits: 500,
        buckets: [],
        usage_this_cycle: { search: 2, enrichment: 3, outreach: 1 },
        low_credit_thresholds: [25, 10, 0],
        low_credit_state: 'healthy',
    });
    mockedFetchBillingCatalog.mockResolvedValue({
        plans: [
            {
                key: 'starter',
                name: 'Starter',
                monthly_price_usd: 60,
                yearly_price_usd: 576,
                monthly_credits: 500,
                limits: { mailboxes: 1, active_campaigns: 2 },
                stripe_product_lookup_key: 'tahoe_plan_starter',
                stripe_monthly_price_lookup_key: 'tahoe_plan_starter_month',
                stripe_yearly_price_lookup_key: 'tahoe_plan_starter_year',
            },
        ],
        topups: [
            {
                key: 'topup_1000',
                credits: 1000,
                price_usd: 80,
                stripe_product_lookup_key: 'tahoe_topup_1000',
                stripe_price_lookup_key: 'tahoe_topup_1000_once',
            },
        ],
        rate_card: {},
        low_credit_thresholds: [25, 10, 0],
        automatic_tax_enabled: false,
        portal_enabled: true,
    });
    mockedCreateBillingPortal.mockResolvedValue({ url: 'https://stripe.test/portal' });
    mockedCreateSubscriptionCheckout.mockResolvedValue({ url: 'https://stripe.test/subscription' });
    mockedCreateTopUpCheckout.mockResolvedValue({ url: 'https://stripe.test/topup' });
});

test('defaults to the overview tab and hides plan actions until the Plans tab is selected', async () => {
    render(<BillingPlanPage />);

    expect(await screen.findByText('Starter')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: 'Rules' })).not.toBeInTheDocument();
    expect(screen.getByText('Available credits')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Choose monthly' })).not.toBeInTheDocument();
});

test('normalizes the removed rules tab to overview', async () => {
    searchParams = new URLSearchParams('tab=rules');

    render(<BillingPlanPage />);

    expect(await screen.findByText('Available credits')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: 'Rules' })).not.toBeInTheDocument();
    await waitFor(() => {
        expect(replaceMock).toHaveBeenCalledWith('/dashboard/billing/plan?tab=overview', { scroll: false });
    });
});

test('switches sections with settings-style tabs and updates the URL', async () => {
    render(<BillingPlanPage />);

    await screen.findByText('Starter');
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));

    expect(screen.getByText('Credit buckets')).toBeInTheDocument();
    expect(screen.getByText('No credit buckets have been granted yet.')).toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith('/dashboard/billing/plan?tab=credits', { scroll: false });
});

test('plans tab starts subscription checkout with existing return paths', async () => {
    render(<BillingPlanPage />);

    await screen.findByText('Starter');
    fireEvent.click(screen.getByRole('tab', { name: 'Plans' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose monthly' }));

    await waitFor(() => {
        expect(mockedCreateSubscriptionCheckout).toHaveBeenCalledWith({
            plan_key: 'starter',
            interval: 'month',
            success_path: '/dashboard/billing/plan',
            cancel_path: '/dashboard/billing/plan',
        });
    });
});

test('top-ups tab starts top-up checkout', async () => {
    render(<BillingPlanPage />);

    await screen.findByText('Starter');
    fireEvent.click(screen.getByRole('tab', { name: 'Top-ups' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buy 1,000' }));

    await waitFor(() => {
        expect(mockedCreateTopUpCheckout).toHaveBeenCalledWith({
            pack_key: 'topup_1000',
            success_path: '/dashboard/billing/plan',
            cancel_path: '/dashboard/billing/plan',
        });
    });
});

test('shows a visible billing error when the Stripe portal action fails', async () => {
    mockedCreateBillingPortal.mockRejectedValue(new Error('Stripe portal unavailable'));

    render(<BillingPlanPage />);

    const button = await screen.findByRole('button', { name: 'Manage in Stripe' });
    fireEvent.click(button);

    expect(await screen.findByText('Stripe portal unavailable')).toBeInTheDocument();
});

test('renders clean empty states for unavailable plans and top-ups', async () => {
    mockedFetchBillingCatalog.mockResolvedValue({
        plans: [],
        topups: [],
        rate_card: {},
        low_credit_thresholds: [25, 10, 0],
        automatic_tax_enabled: false,
        portal_enabled: true,
    });

    render(<BillingPlanPage />);

    await screen.findByRole('tab', { name: 'Plans' });
    fireEvent.click(screen.getByRole('tab', { name: 'Plans' }));
    expect(screen.getByText('No subscription plans are available yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Top-ups' }));
    expect(screen.getByText('No top-up packs are available yet.')).toBeInTheDocument();
});
