import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CampaignDetailPage from './page';
import {
    fetchCampaign,
    markEnrollmentBounced,
    markEnrollmentReplied,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    type CampaignDetail,
    type CampaignSummary,
    type EnrollmentSummary,
} from '@/lib/organization';

const navigationMocks = vi.hoisted(() => ({
    campaignId: 'campaign-1',
}));

vi.mock('next/navigation', () => ({
    useParams: () => ({ campaignId: navigationMocks.campaignId }),
}));

vi.mock('@/lib/organization', () => ({
    fetchCampaign: vi.fn(),
    markEnrollmentBounced: vi.fn(),
    markEnrollmentReplied: vi.fn(),
    pauseCampaign: vi.fn(),
    resumeCampaign: vi.fn(),
    stopCampaign: vi.fn(),
}));

const mockedFetchCampaign = vi.mocked(fetchCampaign);
const mockedMarkEnrollmentBounced = vi.mocked(markEnrollmentBounced);
const mockedMarkEnrollmentReplied = vi.mocked(markEnrollmentReplied);
const mockedPauseCampaign = vi.mocked(pauseCampaign);
const mockedResumeCampaign = vi.mocked(resumeCampaign);
const mockedStopCampaign = vi.mocked(stopCampaign);

function enrollment(index: number, overrides: Partial<EnrollmentSummary> = {}): EnrollmentSummary {
    return {
        id: `enrollment-${index}`,
        campaign_id: 'campaign-1',
        candidate_id: `candidate-${index}`,
        candidate_name: `Candidate ${index}`,
        candidate_email: `candidate-${index}@example.com`,
        company_name: `Company ${index}`,
        job_title: 'Engineer',
        status: 'sent',
        current_step_order: 1,
        next_send_at: `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T12:00:00.000Z`,
        gmail_thread_id: null,
        last_error: null,
        created_at: '2026-05-10T12:00:00.000Z',
        updated_at: '2026-05-10T12:00:00.000Z',
        ...overrides,
    };
}

function campaignDetail(overrides: Partial<CampaignDetail> = {}): CampaignDetail {
    return {
        id: 'campaign-1',
        workspace_id: 'ws-1',
        name: 'Backend outreach',
        list_id: 'list-1',
        list_name: 'Contact engineers',
        mailbox_id: 'mailbox-1',
        mailbox_email: 'recruiting@tahoe.workonward.com',
        status: 'launched',
        steps: [
            {
                step_order: 1,
                subject: 'Subject 1',
                body_text: 'First email body for the campaign.',
                body_html: null,
                delay_days: 0,
            },
            {
                step_order: 2,
                subject: 'Follow up',
                body_text: 'Second email body.',
                body_html: null,
                delay_days: 3,
            },
        ],
        signature: null,
        audience_count: 25,
        eligible_count: 20,
        suppressed_count: 5,
        sent_count: 10,
        replied_count: 5,
        bounced_count: 2,
        created_at: '2026-05-10T12:00:00.000Z',
        updated_at: '2026-05-12T12:00:00.000Z',
        launched_at: '2026-05-12T12:00:00.000Z',
        enrollments: [
            enrollment(1),
            enrollment(2, {
                candidate_email: null,
                status: 'suppressed',
                next_send_at: null,
                last_error: 'Candidate has no enriched email',
            }),
            ...Array.from({ length: 23 }, (_, index) => enrollment(index + 3)),
        ],
        ...overrides,
    };
}

function campaignSummary(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
    const detail = campaignDetail(overrides as Partial<CampaignDetail>);
    const summary = { ...detail };
    delete (summary as Partial<CampaignDetail>).enrollments;
    return summary;
}

beforeEach(() => {
    navigationMocks.campaignId = 'campaign-1';
    mockedFetchCampaign.mockReset();
    mockedMarkEnrollmentBounced.mockReset();
    mockedMarkEnrollmentReplied.mockReset();
    mockedPauseCampaign.mockReset();
    mockedResumeCampaign.mockReset();
    mockedStopCampaign.mockReset();
    mockedFetchCampaign.mockResolvedValue(campaignDetail());
    mockedMarkEnrollmentBounced.mockResolvedValue({ enrollment: enrollment(1, { status: 'bounced' }) });
    mockedMarkEnrollmentReplied.mockResolvedValue({ enrollment: enrollment(1, { status: 'replied' }) });
    mockedPauseCampaign.mockResolvedValue(campaignSummary({ status: 'paused' }));
    mockedResumeCampaign.mockResolvedValue(campaignSummary({ status: 'launched' }));
    mockedStopCampaign.mockResolvedValue(campaignSummary({ status: 'stopped' }));
});

test('renders campaign metrics and paginates audience rows', async () => {
    const user = userEvent.setup();
    render(<CampaignDetailPage />);

    expect(await screen.findByText('Candidate 1')).toBeInTheDocument();
    const metrics = screen.getByLabelText('Campaign metrics');
    expect(within(metrics).getByText('Sent')).toBeInTheDocument();
    expect(within(metrics).queryByText('Reply rate')).not.toBeInTheDocument();
    expect(within(metrics).queryByText('Suppressed')).not.toBeInTheDocument();
    expect(screen.queryByText('50.0%')).not.toBeInTheDocument();
    // The no-email (suppressed) candidate is excluded from the audience table, so
    // 24 of the 25 enrollments are shown.
    expect(screen.getByText('Rows 1-20 of 24 enrollments')).toBeInTheDocument();
    expect(screen.queryByText('Candidate 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate 22')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Rows 21-24 of 24 enrollments')).toBeInTheDocument();
    expect(screen.getByText('Candidate 22')).toBeInTheDocument();
});

test('hides candidates without an enriched email from the audience table', async () => {
    const user = userEvent.setup();
    render(<CampaignDetailPage />);

    await screen.findByText('Candidate 1');
    // Candidate 2 has no email (suppressed at launch) and must never appear.
    expect(screen.queryByText('Candidate 2')).not.toBeInTheDocument();
    expect(screen.queryByText('No email')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Search audience'), 'Candidate 3');
    expect(screen.getByText('Candidate 3')).toBeInTheDocument();
    expect(screen.queryByText('Candidate 1')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search audience'));
    await user.type(screen.getByLabelText('Search audience'), 'missing');
    expect(screen.getByText('No audience rows match this view.')).toBeInTheDocument();
});

test('opens recipient drawer and runs manual reply or bounce actions', async () => {
    const user = userEvent.setup();
    render(<CampaignDetailPage />);

    await user.click(await screen.findByText('Candidate 1'));
    const drawer = await screen.findByLabelText('Recipient detail');
    expect(within(drawer).getByText('candidate-1@example.com')).toBeInTheDocument();
    expect(within(drawer).queryByRole('link', { name: 'Open Gmail' })).not.toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Mark replied' }));

    await waitFor(() => {
        expect(mockedMarkEnrollmentReplied).toHaveBeenCalledWith('campaign-1', 'enrollment-1');
    });

    await user.click(screen.getByText('Candidate 3'));
    const updatedDrawer = screen.getByLabelText('Recipient detail');

    await user.click(within(updatedDrawer).getByRole('button', { name: 'Mark bounced' }));

    await waitFor(() => {
        expect(mockedMarkEnrollmentBounced).toHaveBeenCalledWith('campaign-1', 'enrollment-3');
    });
});

test('disables competing actions while a recipient mutation is in flight', async () => {
    const user = userEvent.setup();
    mockedMarkEnrollmentReplied.mockReturnValueOnce(new Promise(() => undefined));
    render(<CampaignDetailPage />);

    await user.click(await screen.findByText('Candidate 1'));
    const drawer = await screen.findByLabelText('Recipient detail');
    await user.click(within(drawer).getByRole('button', { name: 'Mark replied' }));

    await waitFor(() => {
        expect(within(drawer).getByRole('button', { name: 'Marking...' })).toBeDisabled();
    });
    expect(within(drawer).getByRole('button', { name: 'Mark bounced' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
});

test('shows a fixed-workspace error body when the campaign cannot load', async () => {
    mockedFetchCampaign.mockRejectedValueOnce(new Error('Campaign unavailable'));

    render(<CampaignDetailPage />);

    expect(await screen.findByText('Campaign unavailable')).toBeInTheDocument();
    expect(screen.getByText('Campaign did not load.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Campaign metrics')).not.toBeInTheDocument();
});

test('shows steps and delivery checks in compact tabs', async () => {
    const user = userEvent.setup();
    render(<CampaignDetailPage />);

    await screen.findByText('Candidate 1');
    await user.click(screen.getByRole('tab', { name: 'Steps' }));

    expect(screen.getByText('Subject 1')).toBeInTheDocument();
    expect(screen.getByText('First email body for the campaign.')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Delivery' }));

    expect(screen.getByText('Status breakdown')).toBeInTheDocument();
    expect(screen.getByText('No-email suppressed')).toBeInTheDocument();
    expect(screen.getByText('recruiting@tahoe.workonward.com')).toBeInTheDocument();
});

test('uses confirmation before stopping a campaign', async () => {
    render(<CampaignDetailPage />);

    await screen.findByText('Candidate 1');
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(screen.getByRole('dialog', { name: 'Stop campaign?' })).toBeInTheDocument();
    expect(mockedStopCampaign).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Stop campaign' }));

    await waitFor(() => {
        expect(mockedStopCampaign).toHaveBeenCalledWith('campaign-1');
    });
});
