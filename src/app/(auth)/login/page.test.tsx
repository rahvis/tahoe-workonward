import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginPage from './page';
import { apiRequest, setToken } from '@/lib/api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
    setToken: vi.fn(),
}));

vi.mock('@/components/auth/GoogleAuthSection', () => ({
    __esModule: true,
    default: () => <div data-testid="google-auth-section" />,
}));

const mockedApiRequest = vi.mocked(apiRequest);
const mockedSetToken = vi.mocked(setToken);

beforeEach(() => {
    pushMock.mockReset();
    mockedApiRequest.mockReset();
    mockedSetToken.mockReset();
});

test('submits password login and redirects on success', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ access_token: 'jwt-token' });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/login', {
            method: 'POST',
            body: {
                email: 'user@example.com',
                password: 'super-secret',
            },
        });
        expect(mockedSetToken).toHaveBeenCalledWith('jwt-token');
        expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
});
