import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import SendHealthPage from './page';
import { fetchMailboxes } from '@/lib/organization';

vi.mock('@/lib/organization', () => ({
    fetchMailboxes: vi.fn(),
}));

const mockedFetchMailboxes = vi.mocked(fetchMailboxes);

beforeEach(() => {
    mockedFetchMailboxes.mockReset();
    mockedFetchMailboxes.mockResolvedValue([
        {
            id: 'mailbox-1',
            workspace_id: 'ws-1',
            user_id: 'user-1',
            email: 'mailbox@example.com',
            provider: 'gmail',
            google_subject: 'google-sub-1',
            scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send'],
            mailbox_mode: 'send_only_minimal_scope',
            daily_cap: 100,
            send_window: {
                start_local: '09:00',
                end_local: '17:00',
                weekdays: [1, 2, 3, 4, 5],
                timezone: 'America/Los_Angeles',
            },
            sent_today: 12,
            status: 'healthy',
            last_send_at: '2026-05-10T12:00:00.000Z',
            last_test_send_at: '2026-05-10T11:00:00.000Z',
            last_error: null,
        },
        {
            id: 'mailbox-2',
            workspace_id: 'ws-1',
            user_id: 'user-1',
            email: 'broken@example.com',
            provider: 'gmail',
            google_subject: 'google-sub-2',
            scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send'],
            mailbox_mode: 'send_only_minimal_scope',
            daily_cap: 100,
            send_window: {
                start_local: '09:00',
                end_local: '17:00',
                weekdays: [1, 2, 3, 4, 5],
                timezone: 'America/Los_Angeles',
            },
            sent_today: 0,
            status: 'error',
            last_send_at: null,
            last_test_send_at: null,
            last_error: 'Mailbox temporarily rate limited',
        },
        {
            id: 'mailbox-3',
            workspace_id: 'ws-1',
            user_id: 'user-1',
            email: 'offline@example.com',
            provider: 'gmail',
            google_subject: 'google-sub-3',
            scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send'],
            mailbox_mode: 'send_only_minimal_scope',
            daily_cap: 100,
            send_window: {
                start_local: '09:00',
                end_local: '17:00',
                weekdays: [1, 2, 3, 4, 5],
                timezone: 'America/Los_Angeles',
            },
            sent_today: 0,
            status: 'disconnected',
            last_send_at: null,
            last_test_send_at: null,
            last_error: null,
        },
    ]);
});

test('send health page renders summary metrics from mailbox data', async () => {
    render(<SendHealthPage />);

    const connectedLabel = await screen.findByText('Connected');
    expect(connectedLabel).toBeInTheDocument();
    expect(within(connectedLabel.parentElement as HTMLElement).getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('Healthy').length).toBeGreaterThan(0);
    expect(screen.getByText('Errored')).toBeInTheDocument();
    const disconnectedLabel = screen.getAllByText('Disconnected')[0];
    expect(disconnectedLabel).toBeInTheDocument();
    expect(within(disconnectedLabel.parentElement as HTMLElement).getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/mailbox temporarily rate limited/i)).toBeInTheDocument();
    expect(screen.getByText(/mailbox@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/broken@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/offline@example.com/i)).toBeInTheDocument();
});
