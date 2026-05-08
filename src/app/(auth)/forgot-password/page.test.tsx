import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ForgotPasswordPage from './page';
import { apiRequest } from '@/lib/api';

const altchaHandle = {
    ensureVerified: vi.fn(async () => 'altcha-payload'),
    reset: vi.fn(),
};

vi.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: () => null,
    }),
}));

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
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
    altchaHandle.ensureVerified.mockClear();
    altchaHandle.reset.mockClear();
    mockedApiRequest.mockReset();
});

test('submits forgot-password with ALTCHA payload', async () => {
    const user = userEvent.setup();
    mockedApiRequest.mockResolvedValue({ message: 'ok' });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
        expect(altchaHandle.ensureVerified).toHaveBeenCalledTimes(1);
        expect(mockedApiRequest).toHaveBeenCalledWith('/auth/forgot-password', {
            method: 'POST',
            body: {
                email: 'user@example.com',
                altcha: 'altcha-payload',
            },
        });
        expect(screen.getByText(/Password reset link sent/i)).toBeInTheDocument();
    });
});
