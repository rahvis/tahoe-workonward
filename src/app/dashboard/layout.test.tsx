import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DashboardLayout from './layout';
import {
    apiRequest,
    disableGoogleAutoSelect,
    isLoggedIn,
    removeToken,
} from '@/lib/api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
    usePathname: () => '/dashboard/search',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
    disableGoogleAutoSelect: vi.fn(),
    isLoggedIn: vi.fn(),
    removeToken: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedDisableGoogleAutoSelect = vi.mocked(disableGoogleAutoSelect);
const mockedIsLoggedIn = vi.mocked(isLoggedIn);
const mockedRemoveToken = vi.mocked(removeToken);

beforeEach(() => {
    pushMock.mockReset();
    mockedApiRequest.mockReset();
    mockedDisableGoogleAutoSelect.mockReset();
    mockedIsLoggedIn.mockReset();
    mockedRemoveToken.mockReset();
    mockedIsLoggedIn.mockReturnValue(true);
    mockedApiRequest.mockResolvedValue({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
    });
});

test('logout clears auth state, disables Google auto select, and returns to login', async () => {
    const user = userEvent.setup();
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    const logoutButton = await screen.findByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    await waitFor(() => {
        expect(mockedDisableGoogleAutoSelect).toHaveBeenCalledTimes(1);
        expect(mockedRemoveToken).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith('/login');
    });
});

test('dashboard nav includes the mailboxes section', async () => {
    const user = userEvent.setup();
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    const mailboxesButton = await screen.findByRole('button', { name: /mailboxes/i });
    expect(mailboxesButton).toBeInTheDocument();
    await user.click(mailboxesButton);
    expect(await screen.findByRole('link', { name: /connected mailboxes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /send health/i })).toBeInTheDocument();
});

test('dashboard nav includes the outreach section', async () => {
    const user = userEvent.setup();
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    const outreachButton = await screen.findByRole('button', { name: /outreach/i });
    expect(outreachButton).toBeInTheDocument();
    await user.click(outreachButton);
    expect(await screen.findByRole('link', { name: /campaigns/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /replies/i })).toBeInTheDocument();
});

test('dashboard nav includes the analytics section', async () => {
    const user = userEvent.setup();
    render(
        <DashboardLayout>
            <div>Dashboard Content</div>
        </DashboardLayout>,
    );

    const analyticsButton = await screen.findByRole('button', { name: /analytics/i });
    expect(analyticsButton).toBeInTheDocument();
    await user.click(analyticsButton);
    expect(await screen.findByRole('link', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /campaign performance/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /credit spend/i })).toBeInTheDocument();
});
