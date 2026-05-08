import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Tooltip from '@radix-ui/react-tooltip';
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
    useRouter: () => ({ push: pushMock }),
    usePathname: () => '/dashboard/search',
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
        <Tooltip.Provider>
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        </Tooltip.Provider>,
    );

    await screen.findByText('Test User');
    await user.click(screen.getAllByText('Log out')[0]);

    await waitFor(() => {
        expect(mockedDisableGoogleAutoSelect).toHaveBeenCalledTimes(1);
        expect(mockedRemoveToken).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith('/login');
    });
});
