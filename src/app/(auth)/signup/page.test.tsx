import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SignupPage from './page';
import { apiRequest } from '@/lib/api';

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

beforeEach(() => {
    pushMock.mockReset();
    altchaHandle.ensureVerified.mockClear();
    altchaHandle.reset.mockClear();
    mockedApiRequest.mockReset();
});

test('submits signup with ALTCHA payload and shows verification message', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ is_verified: false });

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('John'), 'Tina');
    await user.type(screen.getByPlaceholderText('Doe'), 'Ng');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'tina@example.com');
    await user.type(screen.getByPlaceholderText('At least 12 characters'), 'super-secret');
    await user.type(screen.getByPlaceholderText('Re-enter your password'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
        expect(altchaHandle.ensureVerified).toHaveBeenCalledTimes(1);
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/signup', {
            method: 'POST',
            body: {
                first_name: 'Tina',
                last_name: 'Ng',
                email: 'tina@example.com',
                password: 'super-secret',
                confirm_password: 'super-secret',
                altcha: 'altcha-payload',
            },
        });
        expect(
            screen.getByText(/Check your email to verify your account/i),
        ).toBeInTheDocument();
    });
});
