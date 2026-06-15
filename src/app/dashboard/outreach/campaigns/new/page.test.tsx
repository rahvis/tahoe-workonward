import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import NewCampaignPage from './page';
import {
    composeCampaignMessage,
    createCampaign,
    fetchBillingSummary,
    fetchList,
    fetchListCandidates,
    fetchLists,
    fetchMailboxes,
    fetchProjects,
    fetchSettings,
    launchCampaign,
} from '@/lib/organization';

const pushMock = vi.fn();
const replaceMock = vi.fn();
let currentSearchParams = 'list_id=list-1';

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard/outreach/campaigns/new',
    useRouter: () => ({ push: pushMock, replace: replaceMock }),
    useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

vi.mock('@/lib/organization', () => ({
    fetchMailboxes: vi.fn(),
    fetchBillingSummary: vi.fn(),
    fetchList: vi.fn(),
    fetchListCandidates: vi.fn(),
    fetchLists: vi.fn(),
    fetchProjects: vi.fn(),
    fetchSettings: vi.fn(),
    createProject: vi.fn(),
    createList: vi.fn(),
    composeCampaignMessage: vi.fn(),
    createCampaign: vi.fn(),
    launchCampaign: vi.fn(),
}));

const mockedFetchMailboxes = vi.mocked(fetchMailboxes);
const mockedFetchBillingSummary = vi.mocked(fetchBillingSummary);
const mockedFetchList = vi.mocked(fetchList);
const mockedFetchListCandidates = vi.mocked(fetchListCandidates);
const mockedFetchLists = vi.mocked(fetchLists);
const mockedFetchProjects = vi.mocked(fetchProjects);
const mockedFetchSettings = vi.mocked(fetchSettings);
const mockedComposeCampaignMessage = vi.mocked(composeCampaignMessage);
const mockedCreateCampaign = vi.mocked(createCampaign);
const mockedLaunchCampaign = vi.mocked(launchCampaign);

const listOne = {
    id: 'list-1',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    project_name: 'Hiring',
    name: 'Backend Engineers',
    candidate_count: 1,
};

const listTwo = {
    id: 'list-2',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    project_name: 'Hiring',
    name: 'Product Designers',
    candidate_count: 1,
};

const candidateOne = {
    id: 1,
    membership_id: 'membership-1',
    candidate_id: 'candidate-1',
    source: 'coresignal',
    source_id: '1',
    full_name: 'Ada Lovelace',
    company_name: 'Acme',
    contact: { work_email: { value: 'ada@example.com' } },
};

const candidateTwo = {
    id: 2,
    membership_id: 'membership-2',
    candidate_id: 'candidate-2',
    source: 'coresignal',
    source_id: '2',
    full_name: 'Grace Hopper',
    company_name: 'Navy',
    contact: { work_email: { value: 'grace@example.com' } },
};

beforeEach(() => {
    currentSearchParams = 'list_id=list-1';
    pushMock.mockReset();
    replaceMock.mockReset();
    mockedFetchMailboxes.mockResolvedValue([
        {
            id: 'mailbox-1',
            workspace_id: 'workspace-1',
            user_id: 'user-1',
            email: 'sender@example.com',
            provider: 'gmail',
            google_subject: 'google-sub',
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
            mailbox_mode: 'send_only_minimal_scope',
            daily_cap: 100,
            send_window: { start_local: '09:00', end_local: '17:00', weekdays: [1, 2, 3, 4, 5], timezone: 'America/Los_Angeles' },
            sent_today: 0,
            status: 'healthy',
        },
    ]);
    mockedFetchBillingSummary.mockResolvedValue({
        workspace_id: 'workspace-1',
        billing: {
            plan_key: 'growth',
            interval: 'month',
            subscription_status: 'active',
        },
        available_credits: 500,
        reserved_credits: 0,
        monthly_included_credits: 2000,
        buckets: [],
        usage_this_cycle: { search: 0, enrichment: 0, outreach: 0 },
        low_credit_thresholds: [25, 10, 0],
        low_credit_state: 'healthy',
    });
    mockedFetchLists.mockResolvedValue([listOne, listTwo]);
    mockedFetchProjects.mockResolvedValue([
        {
            id: 'project-1',
            workspace_id: 'workspace-1',
            name: 'Hiring',
            archived: false,
            list_count: 2,
        },
    ]);
    mockedFetchList.mockImplementation(async (listId: string) => (listId === 'list-2' ? listTwo : listOne));
    mockedFetchListCandidates.mockImplementation(async (listId: string) => ({
        items: listId === 'list-2' ? [candidateTwo] : [candidateOne],
        next_cursor: null,
        total: 1,
        page: 1,
        per_page: 100,
        total_pages: 1,
    }));
    mockedFetchSettings.mockResolvedValue({
        account: {
            first_name: 'Rahul',
            last_name: 'Vishwakarma',
            email: 'rahul@example.com',
            timezone: 'America/Los_Angeles',
            auth_methods: ['password'],
            is_verified: true,
        },
        workspace: {
            name: 'Tahoe Workspace',
            timezone: 'America/Los_Angeles',
            company_website: 'https://workonward.com',
            company_address: '18804 Ibex Ave, Artesia, CA 90701',
            company_address_meta: { source: 'manual' },
        },
        outreach_defaults: {
            signature: {
                sender_name: 'Rahul Vishwakarma',
                sender_email: 'rahul@example.com',
                sender_phone: '555-0000',
                sender_address: 'Settings address',
                sender_website: 'https://workonward.com',
            },
            reply_to_email: null,
            send_window_start: '09:00',
            send_window_end: '17:00',
            send_window_timezone: 'America/Los_Angeles',
            unsubscribe_footer: 'If this is not relevant, you can unsubscribe from future outreach.',
        },
        compliance: {
            retention_days: 365,
            legal_basis_note: 'Customer-controlled recruiting outreach.',
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
    });
    mockedComposeCampaignMessage.mockResolvedValue({
        subject: 'Hi {{first_name}}',
        body_text: 'Saw your work at {{company_name}}.',
        body_html: null,
        followups: [],
        variables_used: ['first_name', 'company_name'],
        compliance_notes: ['Tahoe appends legal footer.'],
    });
    mockedCreateCampaign.mockResolvedValue({
        id: 'campaign-1',
        workspace_id: 'workspace-1',
        name: 'Backend Engineers outreach',
        list_id: 'list-1',
        status: 'draft',
        steps: [],
        audience_count: 1,
        eligible_count: 1,
        suppressed_count: 0,
        sent_count: 0,
        replied_count: 0,
        bounced_count: 0,
    });
    mockedLaunchCampaign.mockResolvedValue({
        campaign_id: 'campaign-1',
        status: 'launched',
        audience_count: 1,
        eligible_count: 1,
        suppressed_count: 0,
        first_step_tasks_created: 1,
    });
});

test('campaign builder renders settings-style tabs and loads a linked list audience', async () => {
    render(<NewCampaignPage />);

    expect((await screen.findAllByText(/backend engineers/i)).length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Audience' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'AI Message' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/campaign builder sections/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/1 eligible/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/role and personalization context/i)).not.toBeInTheDocument();
});

test('builder can select an existing list when no list id is provided', async () => {
    currentSearchParams = '';
    const user = userEvent.setup();
    render(<NewCampaignPage />);

    await screen.findByRole('button', { name: /product designers/i });
    await user.click(screen.getByRole('button', { name: /product designers/i }));

    await waitFor(() => expect(mockedFetchListCandidates).toHaveBeenCalledWith('list-2', { limit: 100 }));
    expect((await screen.findAllByText(/product designers/i)).length).toBeGreaterThan(0);
    expect(replaceMock).toHaveBeenCalledWith(
        expect.stringContaining('list_id=list-2'),
        expect.objectContaining({ scroll: false }),
    );
});

test('audience step has no create list button', async () => {
    currentSearchParams = '';
    render(<NewCampaignPage />);

    await screen.findByRole('button', { name: /product designers/i });
    expect(screen.queryByRole('button', { name: /create list/i })).not.toBeInTheDocument();
});

test('next stays disabled until a list with eligible candidates is selected', async () => {
    currentSearchParams = '';
    const user = userEvent.setup();
    render(<NewCampaignPage />);

    await screen.findByRole('button', { name: /product designers/i });
    // No list selected yet: Next is disabled and later tabs are locked.
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'AI Message' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Review' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /product designers/i }));
    await waitFor(() => expect(mockedFetchListCandidates).toHaveBeenCalledWith('list-2', { limit: 100 }));

    // List with an eligible candidate selected: Next and the next tab unlock.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled());
    expect(screen.getByRole('tab', { name: 'AI Message' })).not.toBeDisabled();
});

test('ai generate fills the first step and launch uses selected list plus campaign-only signature', async () => {
    const user = userEvent.setup();
    render(<NewCampaignPage />);

    await screen.findAllByText(/backend engineers/i);
    await user.click(screen.getByRole('tab', { name: 'AI Message' }));
    await user.type(screen.getByLabelText(/role and personalization context/i), 'Backend role');
    await user.click(screen.getByRole('button', { name: /generate with ai/i }));

    await waitFor(() => expect(mockedComposeCampaignMessage).toHaveBeenCalledWith(expect.objectContaining({ list_id: 'list-1' })));
    expect(await screen.findByText(/saw your work/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Sequence' }));
    expect(await screen.findByDisplayValue('Hi {{first_name}}')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add follow-up/i }));
    expect(screen.getByRole('button', { name: /email 2/i })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Signature' }));
    const phoneInput = screen.getByLabelText(/phone/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, '555-0100');
    const addressInput = screen.getByLabelText(/address/i);
    await user.clear(addressInput);
    await user.type(addressInput, 'Campaign-only address');

    await user.click(screen.getByRole('tab', { name: 'Audience' }));
    await user.click(screen.getByRole('button', { name: /product designers/i }));
    await waitFor(() => expect(mockedFetchListCandidates).toHaveBeenCalledWith('list-2', { limit: 100 }));

    await user.click(screen.getByRole('tab', { name: 'Schedule' }));
    const dailyCapInput = screen.getByLabelText(/daily cap/i);
    await user.clear(dailyCapInput);
    await user.type(dailyCapInput, '80');

    await user.click(screen.getByRole('tab', { name: 'Review' }));
    await user.click(screen.getByRole('button', { name: /launch campaign/i }));

    await waitFor(() => {
        expect(mockedCreateCampaign).toHaveBeenCalledWith(expect.objectContaining({
            list_id: 'list-2',
            schedule: expect.objectContaining({
                daily_campaign_cap: 80,
                window_start_local: '09:00',
                window_end_local: '17:00',
            }),
            signature: expect.objectContaining({
                sender_phone: '555-0100',
                sender_address: 'Campaign-only address',
            }),
        }));
        expect(mockedLaunchCampaign).toHaveBeenCalledWith('campaign-1', expect.any(String));
        expect(screen.getByRole('dialog', { name: /campaign launched/i })).toBeInTheDocument();
    });
    await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/dashboard/outreach/campaigns/campaign-1');
    }, { timeout: 1500 });
}, 10000);
