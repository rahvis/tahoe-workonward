import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MailboxesPage from './page';
import {
    deleteMailbox,
    disconnectMailbox,
    fetchMailboxConnectUrl,
    fetchMailboxes,
    type MailboxSummary,
} from '@/lib/organization';

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
    deleteMailbox: vi.fn(),
}));

const mockedFetchMailboxes = vi.mocked(fetchMailboxes);
const mockedFetchMailboxConnectUrl = vi.mocked(fetchMailboxConnectUrl);
const mockedDisconnectMailbox = vi.mocked(disconnectMailbox);
const mockedDeleteMailbox = vi.mocked(deleteMailbox);

function mailboxFactory(index: number, overrides: Partial<MailboxSummary> = {}): MailboxSummary {
    return {
        id: `mailbox-${index}`,
        workspace_id: 'ws-1',
        user_id: 'user-1',
        email: `mailbox${index}@example.com`,
        provider: 'gmail',
        google_subject: `google-sub-${index}`,
        scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send'],
        mailbox_mode: 'send_only_minimal_scope',
        daily_cap: 100,
        send_window: {
            start_local: '09:00',
            end_local: '17:00',
            weekdays: [1, 2, 3, 4, 5],
            timezone: 'America/Los_Angeles',
        },
        sent_today: index,
        sent_today_reset_at: null,
        last_send_at: null,
        last_test_send_at: null,
        status: 'healthy',
        last_error: null,
        created_at: '2026-05-10T12:00:00Z',
        updated_at: '2026-05-10T12:00:00Z',
        ...overrides,
    };
}

beforeEach(() => {
    assignMock.mockReset();
    mockedFetchMailboxes.mockReset();
    mockedFetchMailboxConnectUrl.mockReset();
    mockedDisconnectMailbox.mockReset();
    mockedDeleteMailbox.mockReset();
    mockedFetchMailboxes.mockResolvedValue([]);
    mockedFetchMailboxConnectUrl.mockResolvedValue({ url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=gmail.send' });
    mockedDisconnectMailbox.mockResolvedValue(mailboxFactory(1, { status: 'disconnected' }));
    mockedDeleteMailbox.mockResolvedValue({ mailbox_id: 'mailbox-1', email: 'mailbox1@example.com', deleted: true });
    Object.defineProperty(window, 'location', {
        configurable: true,
        value: { assign: assignMock },
    });
});

test('mailboxes empty state shows compact send-only messaging and connect CTA', async () => {
    render(<MailboxesPage />);

    expect(await screen.findByText(/connect gmail with send-only permission/i)).toBeInTheDocument();
    const connectButtons = screen.getAllByRole('button', { name: 'Connect Gmail' });
    expect(connectButtons[0]).toHaveClass('tui-button--size-3');
});

test('no "mailbox connected" banner is shown even with connected callback params', async () => {
    mockedFetchMailboxes.mockResolvedValueOnce([mailboxFactory(1)]);

    render(<MailboxesPage />);

    expect(await screen.findByText('mailbox1@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/gmail mailbox connected/i)).not.toBeInTheDocument();
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

test('mailboxes render as a five-row table with pagination', async () => {
    const mailboxes = Array.from({ length: 6 }, (_, index) => mailboxFactory(index + 1));
    mockedFetchMailboxes.mockResolvedValueOnce(mailboxes);
    const user = userEvent.setup();

    render(<MailboxesPage />);

    expect(await screen.findByText('mailbox1@example.com')).toBeInTheDocument();
    expect(screen.getByText('mailbox5@example.com')).toBeInTheDocument();
    expect(screen.queryByText('mailbox6@example.com')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('mailbox6@example.com')).toBeInTheDocument();
    expect(screen.queryByText('mailbox1@example.com')).not.toBeInTheDocument();
});

test('manage opens the selected mailbox modal', async () => {
    mockedFetchMailboxes.mockResolvedValueOnce([mailboxFactory(1)]);
    const user = userEvent.setup();

    render(<MailboxesPage />);

    await user.click((await screen.findAllByRole('button', { name: 'Manage' }))[0]);

    const dialog = screen.getByRole('dialog', { name: 'Manage mailbox' });
    expect(within(dialog).getByText('mailbox1@example.com')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save settings' })).toBeInTheDocument();
});

test('disconnect refreshes the selected row as disconnected', async () => {
    mockedFetchMailboxes
        .mockResolvedValueOnce([mailboxFactory(1)])
        .mockResolvedValueOnce([mailboxFactory(1, { status: 'disconnected' })]);
    const user = userEvent.setup();

    render(<MailboxesPage />);

    await user.click((await screen.findAllByRole('button', { name: 'Manage' }))[0]);
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
        expect(mockedDisconnectMailbox).toHaveBeenCalledWith('mailbox-1');
        expect(mockedFetchMailboxes).toHaveBeenCalledTimes(2);
    });
});

test('delete confirmation removes the row after a successful API response', async () => {
    mockedFetchMailboxes.mockResolvedValueOnce([mailboxFactory(1)]).mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<MailboxesPage />);

    await user.click((await screen.findAllByRole('button', { name: 'Manage' }))[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete mailbox' }));

    await waitFor(() => {
        expect(mockedDeleteMailbox).toHaveBeenCalledWith('mailbox-1');
        expect(screen.queryByText('mailbox1@example.com')).not.toBeInTheDocument();
    });
});

test('blocked delete displays the API error and keeps the row', async () => {
    mockedFetchMailboxes.mockResolvedValueOnce([mailboxFactory(1)]);
    mockedDeleteMailbox.mockRejectedValueOnce(new Error('Stop active campaigns and wait for queued sends before deleting this mailbox.'));
    const user = userEvent.setup();

    render(<MailboxesPage />);

    await user.click((await screen.findAllByRole('button', { name: 'Manage' }))[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete mailbox' }));

    expect((await screen.findAllByText(/stop active campaigns/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('mailbox1@example.com').length).toBeGreaterThan(0);
});

test('disconnected mailboxes disable the send test action in the manage modal', async () => {
    mockedFetchMailboxes.mockResolvedValueOnce([mailboxFactory(1, { status: 'disconnected' })]);
    const user = userEvent.setup();

    render(<MailboxesPage />);

    await user.click((await screen.findAllByRole('button', { name: 'Manage' }))[0]);

    expect(screen.getByRole('button', { name: 'Send test' })).toBeDisabled();
});
