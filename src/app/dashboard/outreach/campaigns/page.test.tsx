import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CampaignsPage from './page';
import { fetchCampaigns } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchCampaigns: vi.fn(),
}));

const mockedFetchCampaigns = vi.mocked(fetchCampaigns);

beforeEach(() => {
    mockedFetchCampaigns.mockReset();
    mockedFetchCampaigns.mockResolvedValue([
        {
            id: 'campaign-1',
            workspace_id: 'ws-1',
            name: 'Backend outreach',
            list_id: 'list-1',
            list_name: 'Contact engineers',
            mailbox_id: 'mailbox-1',
            mailbox_email: 'recruiting@tahoe.ai',
            status: 'launched',
            steps: [],
            audience_count: 20,
            eligible_count: 18,
            suppressed_count: 2,
            sent_count: 12,
            replied_count: 3,
            bounced_count: 1,
            created_at: '2026-05-10T12:00:00.000Z',
            updated_at: '2026-05-12T12:00:00.000Z',
            launched_at: '2026-05-12T12:00:00.000Z',
        },
    ]);
});

test('renders campaigns as a compact row table', async () => {
    render(<CampaignsPage />);

    expect(await screen.findByRole('columnheader', { name: 'Campaign' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Audience' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Replies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Backend outreach' })).toHaveAttribute('href', '/dashboard/outreach/campaigns/campaign-1');
    expect(screen.getByText('Contact engineers · recruiting@tahoe.ai')).toBeInTheDocument();
    expect(screen.getByText('launched')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/dashboard/outreach/campaigns/campaign-1');
    expect(screen.getByRole('button', { name: 'New campaign' })).toHaveClass('tui-button--size-3');
});
