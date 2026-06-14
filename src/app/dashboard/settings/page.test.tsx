import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import SettingsPage from './page';
import {
    autocompleteAddress,
    cancelSubscription,
    resumeSubscription,
    createBillingPortal,
    createSubscriptionCheckout,
    fetchAddressDetails,
    fetchBillingCatalog,
    fetchBillingSummary,
    fetchPaymentSettings,
    fetchSettings,
    requestAccountDeletion,
    updateWorkspaceSettings,
    type DataRequest,
    type InvoiceSummary,
    type ReferralInvite,
    type SettingsAuditEvent,
    type SettingsPayload,
} from '@/lib/organization';

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams('tab=workspace'),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/settings',
    useRouter: () => ({ replace: navigationMocks.replace }),
    useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock('@/lib/organization', () => ({
    autocompleteAddress: vi.fn(),
    cancelSubscription: vi.fn(),
    resumeSubscription: vi.fn(),
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
const mockedCancelSubscription = vi.mocked(cancelSubscription);
const mockedResumeSubscription = vi.mocked(resumeSubscription);
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

function settingsPayload(overrides: Partial<SettingsPayload> & { workspace?: Partial<SettingsPayload['workspace']> } = {}): SettingsPayload {
    const base: SettingsPayload = {
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
    };

    return {
        ...base,
        ...overrides,
        workspace: {
            ...base.workspace,
            ...(overrides.workspace || {}),
        },
    };
}

function makeInvoices(count: number): InvoiceSummary[] {
    return Array.from({ length: count }, (_, index) => {
        const number = index + 1;
        return {
            id: `in_${number}`,
            number: `T-${String(number).padStart(4, '0')}`,
            status: 'paid',
            currency: 'usd',
            amount_due: 6000,
            amount_paid: 6000,
            hosted_invoice_url: `https://invoice.test/in_${number}`,
            invoice_pdf: null,
            created_at: `2026-05-${String(Math.min(number, 28)).padStart(2, '0')}T00:00:00Z`,
            due_date: null,
        };
    });
}

function makeDataRequests(count: number): DataRequest[] {
    return Array.from({ length: count }, (_, index) => {
        const number = index + 1;
        return {
            id: `dr_${number}`,
            workspace_id: 'ws-1',
            request_type: 'workspace_export',
            status: 'requested',
            subject_email_masked: `candidate-${number}@example.com`,
            candidate_id: null,
            notes: null,
            created_at: `2026-05-${String(Math.min(number, 28)).padStart(2, '0')}T00:00:00Z`,
            updated_at: `2026-05-${String(Math.min(number, 28)).padStart(2, '0')}T00:00:00Z`,
            completed_at: null,
        };
    });
}

function makeReferralInvites(count: number): ReferralInvite[] {
    return Array.from({ length: count }, (_, index) => {
        const number = index + 1;
        return {
            id: `ref_${number}`,
            email_masked: `referral-${number}@example.com`,
            status: 'invited',
            referral_code: 'TAHOE-TEST',
            referee_discount_percent: 15,
            referrer_reward_percent: 15,
            sent_at: `2026-05-${String(Math.min(number, 28)).padStart(2, '0')}T00:00:00Z`,
            expires_at: null,
            converted_at: null,
            reward_issued_at: null,
        };
    });
}

function makeSecurityEvents(count: number): SettingsAuditEvent[] {
    return Array.from({ length: count }, (_, index) => {
        const number = index + 1;
        return {
            id: `audit_${number}`,
            workspace_id: 'ws-1',
            actor_user_id: 'user-1',
            event_type: `settings.updated.${number}`,
            target: `workspace-${number}`,
            created_at: `2026-05-${String(Math.min(number, 28)).padStart(2, '0')}T00:00:00Z`,
            metadata: {},
        };
    });
}

beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams('tab=workspace');
    navigationMocks.replace.mockReset();
    mockedFetchSettings.mockReset();
    mockedAutocompleteAddress.mockReset();
    mockedCreateBillingPortal.mockReset();
    mockedCreateSubscriptionCheckout.mockReset();
    mockedFetchAddressDetails.mockReset();
    mockedFetchBillingCatalog.mockReset();
    mockedFetchBillingSummary.mockReset();
    mockedCancelSubscription.mockReset();
    mockedResumeSubscription.mockReset();
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
    navigationMocks.searchParams = new URLSearchParams('tab=account');
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByText('Delete account request');
    expect(screen.getByText('Type DELETE ACCOUNT').closest('label')?.className).toContain('dangerField');
    expect(screen.getByLabelText('Reason or notes').className).toContain('dangerTextarea');

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
    navigationMocks.searchParams = new URLSearchParams('tab=subscription');
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
    navigationMocks.searchParams = new URLSearchParams('tab=payment');
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

test('settings menu hides Account, Integrations, Notifications, and Security tabs', async () => {
    render(<SettingsPage />);

    const menu = await screen.findByRole('navigation', { name: /settings sections/i });
    // Removed from the menu.
    for (const hidden of ['Account', 'Integrations', 'Notifications', 'Security']) {
        expect(within(menu).queryByRole('button', { name: hidden })).not.toBeInTheDocument();
    }
    // Still present.
    for (const shown of ['Workspace', 'Subscription', 'Payment', 'Outreach', 'Compliance', 'Referrals']) {
        expect(within(menu).getByRole('button', { name: shown })).toBeInTheDocument();
    }
});

test('account-deletion tab content is still reachable by direct URL even though hidden', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=account');
    render(<SettingsPage />);
    expect(await screen.findByText('Delete account request')).toBeInTheDocument();
});

test('invalid tab falls back to the default (workspace) and normalizes the URL without scrolling', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=not-real');
    render(<SettingsPage />);

    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
    await waitFor(() => {
        expect(navigationMocks.replace).toHaveBeenCalledWith('/dashboard/settings?tab=workspace', { scroll: false });
    });
});

test('payment invoices paginate at 20 rows', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=payment');
    mockedFetchPaymentSettings.mockResolvedValue({
        stripe_configured: true,
        stripe_customer_id: 'cus_123',
        billing_email: 'billing@example.com',
        default_payment_method: null,
        payment_methods: [],
        recent_invoices: makeInvoices(25),
        can_update_payment_method: true,
        can_remove_payment_method: false,
        can_view_invoices: true,
        message: null,
    });
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(await screen.findByText('T-0001')).toBeInTheDocument();
    expect(screen.getByText('Rows 1-20 of 25 invoices')).toBeInTheDocument();
    expect(screen.queryByText('T-0021')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('T-0021')).toBeInTheDocument();
    expect(screen.getByText('Rows 21-25 of 25 invoices')).toBeInTheDocument();
});

test('compliance data requests paginate at 20 rows', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=compliance');
    mockedFetchSettings.mockResolvedValue(settingsPayload({ data_requests: makeDataRequests(22) }));
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(await screen.findByText('candidate-1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Rows 1-20 of 22 requests')).toBeInTheDocument();
    expect(screen.queryByText('candidate-21@example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('candidate-21@example.com')).toBeInTheDocument();
    expect(screen.getByText('Rows 21-22 of 22 requests')).toBeInTheDocument();
});

test('referral activity paginates at 20 rows', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=referrals');
    mockedFetchSettings.mockResolvedValue(settingsPayload({
        referral: {
            ...settingsPayload().referral,
            invites: makeReferralInvites(23),
        },
    }));
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(await screen.findByText('referral-1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Rows 1-20 of 23 invites')).toBeInTheDocument();
    expect(screen.queryByText('referral-21@example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('referral-21@example.com')).toBeInTheDocument();
    expect(screen.getByText('Rows 21-23 of 23 invites')).toBeInTheDocument();
});

test('security audit events paginate at 20 rows', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=security');
    mockedFetchSettings.mockResolvedValue(settingsPayload({
        security: {
            ...settingsPayload().security,
            recent_sensitive_events: makeSecurityEvents(24),
        },
    }));
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(await screen.findByText('settings.updated.1')).toBeInTheDocument();
    expect(screen.getByText('Rows 1-20 of 24 events')).toBeInTheDocument();
    expect(screen.queryByText('settings.updated.21')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('settings.updated.21')).toBeInTheDocument();
    expect(screen.getByText('Rows 21-24 of 24 events')).toBeInTheDocument();
});

test('successful referral copy clears a stale error banner', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=referrals');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
    });
    const user = userEvent.setup();
    render(<SettingsPage />);

    await screen.findByText('TAHOE-TEST');
    await user.click(screen.getByRole('button', { name: 'Send referral invite' }));
    expect(await screen.findByText('Enter an email address to invite.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(await screen.findByText('Copied.')).toBeInTheDocument();
    expect(screen.queryByText('Enter an email address to invite.')).not.toBeInTheDocument();
});

function activeSubscriptionSummary(overrides: Record<string, unknown> = {}) {
    return {
        workspace_id: 'ws-1',
        billing: {
            plan_key: 'starter',
            interval: 'month',
            subscription_status: 'active',
            current_period_end: '2026-07-14T00:00:00Z',
            cancel_at_period_end: false,
            active_entitlements: ['tahoe-plan-starter'],
            ...overrides,
        },
        available_credits: 100,
        reserved_credits: 0,
        monthly_included_credits: 500,
        buckets: [],
        usage_this_cycle: { search: 0, enrichment: 0, outreach: 0 },
        low_credit_thresholds: [25, 10, 0],
        low_credit_state: 'ok',
    } as unknown as Awaited<ReturnType<typeof fetchBillingSummary>>;
}

test('cancels the subscription from the Subscription tab after confirmation', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=subscription');
    mockedFetchBillingSummary.mockResolvedValue(activeSubscriptionSummary());
    mockedCancelSubscription.mockResolvedValue({
        subscription_id: 'sub_1', cancel_at_period_end: true, current_period_end: null, subscription_status: 'active',
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Cancel subscription' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel subscription' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel subscription' }));

    await waitFor(() => expect(mockedCancelSubscription).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/will cancel at the end of the current billing period/i)).toBeInTheDocument();
});

test('shows Resume when a cancellation is already scheduled', async () => {
    navigationMocks.searchParams = new URLSearchParams('tab=subscription');
    mockedFetchBillingSummary.mockResolvedValue(activeSubscriptionSummary({ cancel_at_period_end: true }));
    mockedResumeSubscription.mockResolvedValue({
        subscription_id: 'sub_1', cancel_at_period_end: false, current_period_end: null, subscription_status: 'active',
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.queryByRole('button', { name: 'Cancel subscription' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Resume subscription' }));
    await waitFor(() => expect(mockedResumeSubscription).toHaveBeenCalledTimes(1));
});
