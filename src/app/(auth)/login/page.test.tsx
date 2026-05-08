import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginPage from './page';
import { apiRequest, setToken } from '@/lib/api';

const pushMock = vi.fn();
const altchaHandle = {
    ensureVerified: vi.fn(async () => 'altcha-payload'),
    reset: vi.fn(),
};

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

vi.mock('@/components/auth/AltchaField', async () => {
    const React = await import('react');
    return {
        __esModule: true,
        default: React.forwardRef(function MockAltchaField(_props, ref) {
            React.useImperativeHandle(ref, () => altchaHandle);
            return <div data-testid="altcha-field" />;
        }),
    };
});

const mockedApiRequest = vi.mocked(apiRequest);
const mockedSetToken = vi.mocked(setToken);

beforeEach(() => {
    pushMock.mockReset();
    altchaHandle.ensureVerified.mockClear();
    altchaHandle.reset.mockClear();
    mockedApiRequest.mockReset();
    mockedSetToken.mockReset();
});

test('submits password login with ALTCHA payload and redirects on success', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ access_token: 'jwt-token' });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
        expect(altchaHandle.ensureVerified).toHaveBeenCalledTimes(1);
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/login', {
            method: 'POST',
            body: {
                email: 'user@example.com',
                password: 'super-secret',
                altcha: 'altcha-payload',
            },
        });
        expect(mockedSetToken).toHaveBeenCalledWith('jwt-token');
        expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
});
