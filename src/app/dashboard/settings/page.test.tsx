import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import SettingsPage from './page';
import {
    autocompleteAddress,
    createBillingPortal,
    createSubscriptionCheckout,
    fetchAddressDetails,
    fetchBillingCatalog,
    fetchBillingSummary,
    fetchPaymentSettings,
    fetchSettings,
    requestAccountDeletion,
    updateWorkspaceSettings,
} from '@/lib/organization';

let searchParams = new URLSearchParams('tab=workspace');

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => searchParams,
}));

vi.mock('@/lib/organization', () => ({
    autocompleteAddress: vi.fn(),
    createBillingPortal: vi.fn(),
    createSubscriptionCheckout: vi.fn(),
    createDataRequest: vi.fn(),
    fetchAddressDetails: vi.fn(),
    fetchBillingCatalog: vi.fn(),
    fetchBillingSummary: vi.fn(),
    fetchPaymentSettings: vi.fn(),
    fetchSettings: vi.fn(),
    inviteReferral: vi.fn(),
    requestAccountDeletion: vi.fn(),
    updateAccountSettings: vi.fn(),
    updateComplianceSettings: vi.fn(),
    updateNotificationSettings: vi.fn(),
    updateOutreachDefaults: vi.fn(),
    updateWorkspaceSettings: vi.fn(),
}));

const mockedFetchSettings = vi.mocked(fetchSettings);
const mockedAutocompleteAddress = vi.mocked(autocompleteAddress);
const mockedCreateBillingPortal = vi.mocked(createBillingPortal);
const mockedCreateSubscriptionCheckout = vi.mocked(createSubscriptionCheckout);
const mockedFetchAddressDetails = vi.mocked(fetchAddressDetails);
const mockedFetchBillingCatalog = vi.mocked(fetchBillingCatalog);
const mockedFetchBillingSummary = vi.mocked(fetchBillingSummary);
const mockedFetchPaymentSettings = vi.mocked(fetchPaymentSettings);
const mockedRequestAccountDeletion = vi.mocked(requestAccountDeletion);
const mockedUpdateWorkspaceSettings = vi.mocked(updateWorkspaceSettings);

function deferred<T>() {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>((nextResolve) => {
        resolve = nextResolve;
    });
    return { promise, resolve };
}

function settingsPayload(overrides: Record<string, unknown> = {}) {
    return {
        account: {
            first_name: 'Rahul',
            last_name: 'Vishwakarma',
            email: 'rahul@example.com',
            timezone: 'America/Los_Angeles',
            auth_methods: ['password'],
            is_verified: true,
            account_deletion_confirmation_text: 'DELETE ACCOUNT',
        },
        workspace: {
            name: 'Tahoe Workspace',
            billing_contact_email: null,
            timezone: 'America/Los_Angeles',
            company_website: 'https://workonward.com',
            company_address: '',
            company_address_meta: { source: 'manual' },
            ...(overrides.workspace || {}),
        },
        outreach_defaults: {
            signature: null,
            reply_to_email: null,
            send_window_start: '09:00',
            send_window_end: '17:00',
            send_window_timezone: 'America/Los_Angeles',
            unsubscribe_footer: 'If this is not relevant, you can unsubscribe from future outreach.',
        },
        compliance: {
            retention_days: 365,
            privacy_contact_email: null,
            legal_basis_note: 'Customer-controlled recruiting outreach.',
            privacy_policy_url: 'http://localhost:3000/privacy',
            terms_url: 'http://localhost:3000/terms',
        },
        notifications: {
            billing_low_credit: true,
            campaign_send_health: true,
            enrichment_completed: true,
            referral_updates: true,
            security_alerts: true,
        },
        integrations: [],
        security: {
            auth_methods: ['password'],
            email_verified: true,
            active_sessions_supported: false,
            two_factor_supported: false,
            sso_supported: false,
            recent_sensitive_events: [],
        },
        referral: {
            referral_code: 'TAHOE-TEST',
            share_url: 'http://localhost:3000/signup?ref=TAHOE-TEST',
            referee_discount_percent: 15,
            referrer_reward_percent: 15,
            invite_expires_days: 90,
            reward_expires_days: 180,
            terms: [],
            invites: [],
        },
        data_requests: [],
        audit_events: [],
        ...overrides,
    };
}

beforeEach(() => {
    searchParams = new URLSearchParams('tab=workspace');
    mockedFetchSettings.mockReset();
    mockedAutocompleteAddress.mockReset();
    mockedCreateBillingPortal.mockReset();
    mockedCreateSubscriptionCheckout.mockReset();
    mockedFetchAddressDetails.mockReset();
    mockedFetchBillingCatalog.mockReset();
    mockedFetchBillingSummary.mockReset();
    mockedFetchPaymentSettings.mockReset();
    mockedRequestAccountDeletion.mockReset();
    mockedUpdateWorkspaceSettings.mockReset();

    mockedFetchSettings.mockResolvedValue(settingsPayload());
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
        topups: [],
        rate_card: {},
        low_credit_thresholds: [25, 10, 0],
        automatic_tax_enabled: false,
        portal_enabled: true,
    });
    mockedFetchBillingSummary.mockResolvedValue({
        workspace_id: 'ws-1',
        billing: {
            plan_key: null,
            interval: null,
            subscription_status: null,
            current_period_end: null,
            cancel_at_period_end: false,
            active_entitlements: [],
        },
        available_credits: 0,
        reserved_credits: 0,
        monthly_included_credits: 0,
        buckets: [],
        usage_this_cycle: { search: 0, enrichment: 0, outreach: 0 },
        low_credit_thresholds: [25, 10, 0],
        low_credit_state: 'empty',
    });
    mockedFetchPaymentSettings.mockResolvedValue({
        stripe_configured: true,
        stripe_customer_id: 'cus_123',
        billing_email: 'billing@example.com',
        default_payment_method: {
            id: 'pm_123',
            type: 'card',
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2030,
            billing_name: 'Rahul',
            billing_email: 'card@example.com',
            is_default: true,
        },
        payment_methods: [],
        recent_invoices: [
            {
                id: 'in_123',
                number: 'T-0001',
                status: 'paid',
                currency: 'usd',
                amount_due: 6000,
                amount_paid: 6000,
                hosted_invoice_url: 'https://invoice.test/in_123',
                invoice_pdf: null,
                created_at: '2026-05-10T00:00:00Z',
                due_date: null,
            },
        ],
        can_update_payment_method: true,
        can_remove_payment_method: false,
        can_view_invoices: true,
        message: null,
    });
    mockedCreateBillingPortal.mockResolvedValue({ url: 'https://billing.stripe.test/session' });
    mockedCreateSubscriptionCheckout.mockResolvedValue({ url: 'https://checkout.stripe.test/session' });
    mockedRequestAccountDeletion.mockResolvedValue({
        id: 'dr_123',
        workspace_id: 'ws-1',
        request_type: 'account_delete',
        status: 'requested',
        subject_email_masked: 'r***l@example.com',
        candidate_id: null,
        notes: null,
        created_at: '2026-05-10T00:00:00Z',
        updated_at: '2026-05-10T00:00:00Z',
        completed_at: null,
    });
    mockedAutocompleteAddress.mockResolvedValue({
        predictions: [
            {
                place_id: 'place-1',
                text: '18804 Ibex Ave, Artesia, CA, USA',
                main_text: '18804 Ibex Ave',
                secondary_text: 'Artesia, CA, USA',
                types: ['street_address'],
            },
        ],
    });
    mockedFetchAddressDetails.mockResolvedValue({
        source: 'google_places',
        place_id: 'place-1',
        formatted_address: '18804 Ibex Ave, Artesia, CA 90701, USA',
        address_components: [],
        location: { latitude: 33.867, longitude: -118.083 },
    });
    mockedUpdateWorkspaceSettings.mockImplementation(async (payload) => settingsPayload({ workspace: payload }).workspace && settingsPayload({ workspace: payload }));
});

test('workspace address suggestions can be selected and saved with google metadata', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const addressInput = await screen.findByLabelText('Company postal address');
    fireEvent.focus(addressInput);
    fireEvent.change(addressInput, { target: { value: '18804 Ibex' } });

    expect(await screen.findByText('18804 Ibex Ave')).toBeInTheDocument();
    await user.click(screen.getByText('18804 Ibex Ave'));

    expect(await screen.findByDisplayValue('18804 Ibex Ave, Artesia, CA 90701, USA')).toBeInTheDocument();
    expect(screen.getByText('Source: Google Places selected address')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
        expect(mockedUpdateWorkspaceSettings).toHaveBeenCalledWith(expect.objectContaining({
            company_address: '18804 Ibex Ave, Artesia, CA 90701, USA',
            company_address_meta: expect.objectContaining({ source: 'google_places', place_id: 'place-1' }),
        }));
    });
});

test('manual edit after selection starts prevents stale details from overwriting address', async () => {
    const user = userEvent.setup();
    const details = deferred<Awaited<ReturnType<typeof fetchAddressDetails>>>();
    mockedFetchAddressDetails.mockReturnValue(details.promise);

    render(<SettingsPage />);
    const addressInput = await screen.findByLabelText('Company postal address');
    fireEvent.focus(addressInput);
    fireEvent.change(addressInput, { target: { value: '18804 Ibex' } });
    await screen.findByText('18804 Ibex Ave');

    await user.click(screen.getByText('18804 Ibex Ave'));
    fireEvent.change(addressInput, { target: { value: 'Manual address' } });
    details.resolve({
        source: 'google_places',
        place_id: 'place-1',
        formatted_address: '18804 Ibex Ave, Artesia, CA 90701, USA',
        address_components: [],
        location: { latitude: 33.867, longitude: -118.083 },
    });

    await waitFor(() => {
        expect(screen.getByDisplayValue('Manual address')).toBeInTheDocument();
    });
    expect(screen.getByText('Source: Manual address entry')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
        expect(mockedUpdateWorkspaceSettings).toHaveBeenCalledWith(expect.objectContaining({
            company_address: 'Manual address',
            company_address_meta: { source: 'manual' },
        }));
    });
});

test('account deletion danger zone creates request only after typed confirmation', async () => {
    searchParams = new URLSearchParams('tab=account');
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByText('Delete account request');
    const submitButton = screen.getByRole('button', { name: 'Request account deletion' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText('Type DELETE ACCOUNT'), 'DELETE ACCOUNT');
    await user.click(submitButton);

    await waitFor(() => {
        expect(mockedRequestAccountDeletion).toHaveBeenCalledWith({
            confirmation: 'DELETE ACCOUNT',
            reason: null,
        });
    });
});

test('subscription tab starts checkout when there is no active subscription', async () => {
    searchParams = new URLSearchParams('tab=subscription');
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByText('Plan options');
    await user.click(screen.getByRole('button', { name: 'Yearly' }));

    await waitFor(() => {
        expect(mockedCreateSubscriptionCheckout).toHaveBeenCalledWith({
            plan_key: 'starter',
            interval: 'year',
            success_path: '/dashboard/settings?tab=subscription',
            cancel_path: '/dashboard/settings?tab=subscription',
        });
    });
});

test('payment tab renders safe card summary and opens Stripe portal flow', async () => {
    searchParams = new URLSearchParams('tab=payment');
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(await screen.findByText('Visa ending in 4242')).toBeInTheDocument();
    expect(screen.getByText('T-0001')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update payment method' }));

    await waitFor(() => {
        expect(mockedCreateBillingPortal).toHaveBeenCalledWith(
            '/dashboard/settings?tab=payment',
            'payment_method_update',
        );
    });
});
