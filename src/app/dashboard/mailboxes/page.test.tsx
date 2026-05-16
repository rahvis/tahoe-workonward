import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MailboxesPage from './page';
import { fetchMailboxConnectUrl, fetchMailboxes } from '@/lib/organization';

const assignMock = vi.fn();

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('status=connected&mailbox=mailbox%40example.com'),
}));

vi.mock('@/lib/organization', () => ({
    fetchMailboxes: vi.fn(),
    fetchMailboxConnectUrl: vi.fn(),
    updateMailbox: vi.fn(),
    sendMailboxTest: vi.fn(),
    disconnectMailbox: vi.fn(),
}));

const mockedFetchMailboxes = vi.mocked(fetchMailboxes);
const mockedFetchMailboxConnectUrl = vi.mocked(fetchMailboxConnectUrl);

beforeEach(() => {
    assignMock.mockReset();
    mockedFetchMailboxes.mockReset();
    mockedFetchMailboxConnectUrl.mockReset();
    mockedFetchMailboxes.mockResolvedValue([]);
    mockedFetchMailboxConnectUrl.mockResolvedValue({ url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=gmail.send' });
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { assign: assignMock },
    });
});

test('mailboxes empty state shows minimum-scope messaging and dashboard-sized connect CTA', async () => {
    render(<MailboxesPage />);

    expect(await screen.findByText(/gmail mailbox connected: mailbox@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/does not read your mailbox/i)).toBeInTheDocument();
    const connectButtons = screen.getAllByRole('button', { name: 'Connect Gmail' });
    expect(connectButtons[0]).toHaveClass('tui-button--size-3');
});

test('connect gmail requests the backend URL and redirects the browser', async () => {
    const user = userEvent.setup();
    render(<MailboxesPage />);

    await user.click(await screen.findByRole('button', { name: 'Connect Gmail' }));

    await waitFor(() => {
        expect(mockedFetchMailboxConnectUrl).toHaveBeenCalledWith('/dashboard/mailboxes');
        expect(assignMock).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?scope=gmail.send');
    });
});

test('disconnected mailboxes disable the send test action', async () => {
    mockedFetchMailboxes.mockResolvedValueOnce([
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
            sent_today: 0,
            sent_today_reset_at: null,
            last_send_at: null,
            last_test_send_at: null,
            status: 'disconnected',
            last_error: null,
        },
    ]);

    render(<MailboxesPage />);

    expect(await screen.findByText(/mailbox@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send test email' })).toBeDisabled();
});
