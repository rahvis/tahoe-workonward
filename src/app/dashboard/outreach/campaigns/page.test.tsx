import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CampaignsPage from './page';
import { fetchCampaigns, type CampaignSummary } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchCampaigns: vi.fn(),
}));

const mockedFetchCampaigns = vi.mocked(fetchCampaigns);

function campaign(index: number, overrides: Partial<CampaignSummary> = {}): CampaignSummary {
    return {
        id: `campaign-${index}`,
        workspace_id: 'ws-1',
        name: `Campaign ${index}`,
        list_id: 'list-1',
        list_name: 'Contact engineers',
        mailbox_id: 'mailbox-1',
        mailbox_email: 'recruiting@tahoe.workonward.com',
        status: 'launched',
        steps: [],
        audience_count: 20 + index,
        eligible_count: 18 + index,
        suppressed_count: index % 3,
        sent_count: 10 + index,
        replied_count: index % 5,
        bounced_count: index % 2,
        created_at: `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T12:00:00.000Z`,
        updated_at: `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T12:00:00.000Z`,
        launched_at: `2026-05-${String(Math.min(index, 28)).padStart(2, '0')}T12:00:00.000Z`,
        ...overrides,
    };
}

beforeEach(() => {
    mockedFetchCampaigns.mockReset();
    mockedFetchCampaigns.mockResolvedValue([
        campaign(1, { name: 'Backend outreach', replied_count: 3, sent_count: 12 }),
        campaign(2, { name: 'Growth PM follow-up', status: 'paused' }),
        ...Array.from({ length: 23 }, (_, index) => campaign(index + 3)),
    ]);
});

test('renders campaigns as a compact paginated workspace', async () => {
    const user = userEvent.setup();
    render(<CampaignsPage />);

    expect(await screen.findByRole('columnheader', { name: 'Campaign' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Reply rate' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Suppressed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create campaign' })).toHaveAttribute(
        'href',
        '/dashboard/outreach/campaigns/new',
    );
    expect(screen.getByRole('link', { name: 'Campaign 25' })).toHaveAttribute(
        'href',
        '/dashboard/outreach/campaigns/campaign-25',
    );
    expect(screen.getByText('Rows 1-20 of 25 campaigns')).toBeInTheDocument();
    expect(screen.queryByText('Campaign 5')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Rows 21-25 of 25 campaigns')).toBeInTheDocument();
    expect(screen.getByText('Campaign 5')).toBeInTheDocument();
    expect(screen.getByText('Backend outreach')).toBeInTheDocument();
});

test('filters campaigns by search and status', async () => {
    const user = userEvent.setup();
    render(<CampaignsPage />);

    await screen.findByText('Campaign 25');
    await user.type(screen.getByLabelText('Search campaigns'), 'Growth');

    expect(screen.getByText('Growth PM follow-up')).toBeInTheDocument();
    expect(screen.queryByText('Backend outreach')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'launched');

    expect(screen.getByText('No campaigns match this view.')).toBeInTheDocument();
});

test('shows a load error without the empty campaign copy', async () => {
    mockedFetchCampaigns.mockRejectedValueOnce(new Error('Unable to reach campaigns'));

    render(<CampaignsPage />);

    expect(await screen.findByText('Unable to reach campaigns')).toBeInTheDocument();
    expect(screen.getByText('Campaigns did not load.')).toBeInTheDocument();
    expect(screen.queryByText('No campaigns yet. Create one from an enriched list.')).not.toBeInTheDocument();
    expect(mockedFetchCampaigns.mock.calls[0]?.[0]).toHaveProperty('signal');
});
